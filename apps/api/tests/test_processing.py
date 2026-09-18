def test_dev_flow_persists_inbound_and_generated_response(client) -> None:
    company = client.post(
        "/dev/companies",
        json={"name": "Studio Aurora", "slug": "studio-aurora"},
    ).json()

    article = client.post(
        "/knowledge",
        json={
            "tenant_id": company["id"],
            "title": "Horário",
            "content": "Atendimento de segunda a sexta, das 9h às 18h.",
            "approved_by": "piloto",
        },
    )
    assert article.status_code == 201

    response = client.post(
        "/dev/messages",
        json={
            "tenant_id": company["id"],
            "channel": "whatsapp",
            "external_message_id": "msg-flow-1",
            "external_contact_id": "contact-flow-1",
            "text": "Qual é o horário?",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["duplicate"] is False
    assert data["handoff"] is False
    assert data["assistant_message_id"] is not None
    assert "Hermes Agent ainda não está habilitado" in data["assistant_text"]

    conversation = client.get(f"/conversations/{data['conversation_id']}")
    assert conversation.status_code == 200
    messages = conversation.json()["messages"]
    assert [m["direction"] for m in messages] == ["inbound", "outbound"]
