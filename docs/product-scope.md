# Escopo do MVP/Piloto

## Dentro do primeiro produto

1. Atendimento de texto em WhatsApp e Instagram Direct.
2. Base de conhecimento aprovada e versionada por empresa.
3. Cadastro de interessados.
4. Consulta/solicitação de agenda.
5. Handoff humano com histórico e estado persistente.
6. Histórico por empresa e contato.
7. Configuração com publicação controlada.
8. Indicadores de volume, resolução, encaminhamento, falhas e custo.

## Fora do primeiro produto

- áudio e imagens;
- pagamentos;
- campanhas;
- lembretes automáticos antes de homologação;
- comentários públicos e publicações no Instagram;
- financeiro, estoque, folha e anúncios.

## Estados de conversa

- `new`
- `collecting_information`
- `awaiting_confirmation`
- `awaiting_tool`
- `human_handoff`
- `resolved`
- `operational_failure`

## Princípios obrigatórios

- cada registro comercial pertence a um tenant;
- o tenant é derivado da conexão de canal autenticada, nunca do texto da mensagem;
- mensagens duplicadas não geram ação duplicada;
- handoff humano suspende respostas automáticas;
- antes de enviar uma resposta, o servidor revalida o estado da conversa;
- regras críticas de autorização ficam no servidor, não somente no prompt.
