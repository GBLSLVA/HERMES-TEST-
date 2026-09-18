def _company(client) -> str:
    response = client.post(
        "/dev/companies",
        json={"name": "Studio Aurora", "slug": "studio-aurora"},
    )
    return response.json()["id"]


def test_explicit_human_request_pauses_automation(client) -> None:
    tenant_id = _company(client)
    response = client.post(
        "/dev/messages",
        json={
            "tenant_id": tenant_id,
            "channel": "whatsapp",
            "external_message_id": "msg-human-1",
            "external_contact_id": "contact-99",
            "text": "Quero falar com um atendente",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["handoff"] is True
    assert data["state"] == "human_handoff"
    assert data["assistant_message_id"] is None

    conversation = client.get(f"/conversations/{data['conversation_id']}")
    assert conversation.status_code == 200
    assert conversation.json()["automation_paused"] is True


def test_resume_reenables_automation(client) -> None:
    tenant_id = _company(client)
    result = client.post(
        "/dev/messages",
        json={
            "tenant_id": tenant_id,
            "channel": "whatsapp",
            "external_message_id": "msg-human-2",
            "external_contact_id": "contact-100",
            "text": "Atendimento humano, por favor",
        },
    ).json()

    resumed = client.post(f"/conversations/{result['conversation_id']}/resume")
    assert resumed.status_code == 200
    assert resumed.json()["state"] == "collecting_information"
    assert resumed.json()["automation_paused"] is False


def test_new_message_does_not_generate_reply_while_human_has_control(client) -> None:
    tenant_id = _company(client)
    first = client.post(
        "/dev/messages",
        json={
            "tenant_id": tenant_id,
            "channel": "whatsapp",
            "external_message_id": "msg-human-3",
            "external_contact_id": "contact-101",
            "text": "Quero falar com uma pessoa",
        },
    ).json()
    assert first["handoff"] is True

    second = client.post(
        "/dev/messages",
        json={
            "tenant_id": tenant_id,
            "channel": "whatsapp",
            "external_message_id": "msg-human-4",
            "external_contact_id": "contact-101",
            "text": "Ainda estou aguardando",
        },
    )
    assert second.status_code == 200
    data = second.json()
    assert data["handoff"] is True
    assert data["assistant_message_id"] is None
