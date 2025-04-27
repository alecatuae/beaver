# Observabilidade

Esta pasta contém as configurações e arquivos necessários para o monitoramento e observabilidade da aplicação Beaver.

## Estrutura

- `/prometheus/` - Configurações do Prometheus para coleta de métricas
- `/grafana/` - Dashboards e configurações do Grafana
- `/loki/` - Configurações do Loki para agregação de logs
- `/tempo/` - Configurações do Tempo para rastreamento distribuído

## Uso

Para iniciar os serviços de observabilidade, execute:

```bash
docker-compose --profile observability up -d
```

## Acessando

- **Grafana**: http://localhost:3001 (usuário: admin, senha: admin)
- **Prometheus**: http://localhost:9090
- **Loki UI**: Acessado via Grafana
- **Tempo UI**: Acessado via Grafana

## Notas

Os dados persistentes são armazenados nos volumes Docker correspondentes.
Confira o arquivo `.gitignore` para entender quais arquivos são excluídos do controle de versão. 