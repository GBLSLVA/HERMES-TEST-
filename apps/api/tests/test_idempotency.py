def _company(client, slug: str = "studio-aurora") -> str:
    response = client.post("/dev/companies", json={"name": "Studio Aurora", "slug": slug})
    assert response.status_code == 201
    return response.json()["id"]


def test_duplicate_event_is_detected_per_tenant(client) -> None:
    tenant_id = _company(client)
    payload = {
        "tenant_id": tenant_id,
        "channel": "whatsapp",
        "external_message_id": "msg-1",
        "external_contact_id": "contact-1",
        "text": "Olá",
    }

    first = client.post("/webhooks/whatsapp", json=payload)
    second = client.post("/webhooks/whatsapp", json=payload)

    assert first.status_code == 202
    assert first.json()["duplicate"] is False
    assert second.status_code == 202
    assert second.json()["duplicate"] is True
    assert first.json()["conversation_id"] == second.json()["conversation_id"]


def test_same_external_id_is_not_duplicate_across_tenants(client) -> None:
    tenant_a = _company(client, "empresa-a")
    response = client.post("/dev/companies", json={"name": "Empresa B", "slug": "empresa-b"})
    tenant_b = response.json()["id"]

    base = {
        "channel": "whatsapp",
        "external_message_id": "shared-provider-id",
        "external_contact_id": "contact-1",
        "text": "Olá",
    }
    a = client.post("/webhooks/whatsapp", json={**base, "tenant_id": tenant_a})
    b = client.post("/webhooks/whatsapp", json={**base, "tenant_id": tenant_b})

    assert a.json()["duplicate"] is False
    assert b.json()["duplicate"] is False
    assert a.json()["conversation_id"] != b.json()["conversation_id"]
