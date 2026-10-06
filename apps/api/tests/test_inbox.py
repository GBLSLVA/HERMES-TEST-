def _create_company(client, name: str, slug: str) -> str:
    response = client.post("/dev/companies", json={"name": name, "slug": slug})
    assert response.status_code == 201
    return response.json()["id"]


def _send_message(client, tenant_id: str, contact: str, message_id: str, text: str):
    return client.post(
        "/dev/messages",
        json={
            "tenant_id": tenant_id,
            "channel": "whatsapp",
            "external_message_id": message_id,
            "external_contact_id": contact,
            "text": text,
        },
    )


def test_inbox_lists_only_requested_tenant(client) -> None:
    tenant_a = _create_company(client, "Empresa A", "empresa-a")
    tenant_b = _create_company(client, "Empresa B", "empresa-b")

    a = _send_message(client, tenant_a, "contact-a", "msg-a", "Mensagem A")
    b = _send_message(client, tenant_b, "contact-b", "msg-b", "Mensagem B")
    assert a.status_code == 200
    assert b.status_code == 200

    response = client.get(f"/conversations?tenant_id={tenant_a}")
    assert response.status_code == 200
    items = response.json()

    assert len(items) == 1
    assert items[0]["tenant_id"] == tenant_a
    assert items[0]["contact_external_id"] == "contact-a"
    assert items[0]["last_message_text"] is not None


def test_conversation_detail_blocks_cross_tenant_access(client) -> None:
    tenant_a = _create_company(client, "Empresa A", "empresa-a")
    tenant_b = _create_company(client, "Empresa B", "empresa-b")

    result = _send_message(
        client,
        tenant_b,
        "contact-b",
        "msg-b-private",
        "Mensagem privada da empresa B",
    ).json()

    response = client.get(
        f"/conversations/{result['conversation_id']}?tenant_id={tenant_a}"
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "conversation_not_found"


def test_handoff_action_is_tenant_scoped(client) -> None:
    tenant_a = _create_company(client, "Empresa A", "empresa-a")
    tenant_b = _create_company(client, "Empresa B", "empresa-b")

    result = _send_message(
        client,
        tenant_b,
        "contact-b",
        "msg-b-handoff",
        "Olá",
    ).json()

    response = client.post(
        f"/conversations/{result['conversation_id']}/handoff?tenant_id={tenant_a}",
        json={"reason": "operator_takeover", "assigned_to": "Gabriel"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "conversation_not_found"
