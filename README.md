# Lotes de leilão

Uma aplicação full stack para cadastrar, localizar e consultar lotes de leilão. Além do contrato mínimo do desafio, a entrega inclui busca, paginação, ordenação, validação em duas camadas, estados resilientes de interface, acessibilidade e automação de qualidade.

## Diferenciais da entrega

- Identidade visual responsiva, com experiência adaptada para desktop e celular;
- máscara monetária em reais e limite de `R$ 99.999.999,99`;
- número de lote exclusivamente numérico, preservando zeros à esquerda;
- unicidade garantida também pelo SQLite, inclusive sob requisições concorrentes;
- busca exata por número, paginação e seis opções de ordenação refletidas na URL;
- feedback de carregamento, sucesso, conflito, catálogo vazio, busca vazia e API indisponível;
- foco visível, HTML semântico, regiões vivas e contraste validado com axe;
- testes unitários, de integração e E2E executados pelo GitHub Actions.

## Stack e decisões

- **API:** FastAPI, SQLAlchemy e SQLite. O banco local fica em `backend/data/lotes.db` e não é versionado.
- **Interface:** React, Vite e TypeScript, com CSS próprio e fontes empacotadas no build — sem dependência de CDN.
- **Preço:** `Decimal`/`NUMERIC` no backend, positivo, com até duas casas e teto de `99.999.999,99`.
- **Número:** somente dígitos; espaços externos são removidos. `" 07 "` conflita com `"07"`, enquanto `"07"` e `"7"` são distintos.
- **Persistência:** a tabela é criada automaticamente, uma escolha proporcional ao escopo; migrations estão registradas como evolução futura.
- **Estado da listagem:** `pagina`, `por_pagina`, `ordenar`, `direcao` e `busca` ficam na URL para permitir recarregar e compartilhar a visualização.

## Pré-requisitos

- Node.js 22 ou mais recente;
- [`uv`](https://docs.astral.sh/uv/) e Python 3.12. No Windows com Scoop: `scoop install uv`.

## Como executar

Na raiz do projeto:

```bash
npm run setup
npm run dev
```

A interface abre em `http://localhost:5173` e o Swagger da API em `http://localhost:8000/docs`.

## Com Docker (opcional)

Com Docker Engine e Docker Compose instalados, execute na raiz do projeto:

```bash
docker compose up --build
```

A interface ficará disponível em `http://localhost:8080` e a documentação da API em `http://localhost:8000/docs`. O banco SQLite é preservado no volume nomeado `lotes_data`.

Para encerrar os serviços, use `docker compose down`. Para remover também os dados persistidos, use `docker compose down -v`.

Para usar outra API, copie `frontend/.env.example` para `frontend/.env.local` e ajuste `VITE_API_URL`. Para liberar outras origens na API, defina `CORS_ORIGINS` como uma lista separada por vírgulas.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run setup` | Instala dependências JavaScript e sincroniza o ambiente Python. |
| `npm run dev` | Inicia API e interface em paralelo. |
| `npm test` | Executa Pytest e Vitest. |
| `npm run test:e2e` | Executa o fluxo real e a auditoria axe no Chromium. |
| `npm run lint` | Verifica Python com Ruff e TypeScript/React com ESLint. |
| `npm run build` | Valida tipos e gera o build de produção. |
| `npm run verify` | Executa toda a esteira local de qualidade. |

## Publicação no GitHub

O repositório inclui o pipeline `.github/workflows/ci.yml`. A cada push ou pull request, o GitHub executa lint, testes da API e da interface, build de produção, fluxo E2E e auditoria de acessibilidade.

Depois de criar um repositório vazio no GitHub, publique a partir da raiz deste projeto:

```bash
git add .
git commit -m "Entrega do desafio técnico"
git branch -M main
git remote add origin <URL-DO-REPOSITORIO-GITHUB>
git push -u origin main
```

O código não depende de variáveis secretas para o pipeline. Arquivos locais `.env` são ignorados, enquanto `.env.example` permanece versionado para documentar a configuração.

## API

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/lotes` | Lista paginada. Aceita `pagina`, `por_pagina`, `ordenar`, `direcao` e `busca`. |
| `POST` | `/lotes` | Cria um lote, retorna `201` e `Location: /lotes/{id}`. |
| `GET` | `/lotes/{id}` | Retorna um lote ou `404`. |

Exemplo de criação:

```json
{
  "numero": "07",
  "preco": 1850.0
}
```

Resposta da listagem:

```json
{
  "itens": [{ "id": 1, "numero": "07", "preco": 1850.0 }],
  "total": 1,
  "pagina": 1,
  "por_pagina": 10,
  "total_paginas": 1
}
```

Entradas inválidas retornam `422`, número repetido retorna `409` e lote inexistente retorna `404`.

## Qualidade verificada

| Camada | Cobertura atual |
| --- | --- |
| API | 16 testes Pytest: criação, consulta, validações, conflitos, busca, paginação e ordenação. |
| Interface | 9 testes Vitest/Testing Library: estados, máscara, criação, conflito, URL, busca e paginação. |
| Navegador | 4 execuções Playwright: fluxo integrado e regras WCAG A/AA em desktop e mobile. |
| Estática | Ruff, ESLint, TypeScript e build Vite. |
| Contêineres | Docker Compose com Nginx servindo a interface e proxy reverso para a API. |

O workflow em `.github/workflows/ci.yml` repete essas verificações em cada push e pull request.

## O que significa testar em um “clone limpo”?

É clonar o repositório em uma pasta vazia e seguir somente o README, como outra pessoa faria. Isso confirma que o projeto não depende do seu banco, de arquivos ignorados ou de pacotes já instalados na máquina. Depois de publicar o repositório, a checagem é:

```bash
git clone <url-do-repositorio>
cd lotes-leilao
npm run setup
npm run verify
```

Antes da publicação, `npm ci`, `uv sync --locked` e o CI reproduzem a mesma instalação determinística.

## Se houvesse mais tempo e ferramentas

- Utilizaria um servidor como banco de dados hospedado em nuvem, com serviços como AWS
- Prepararia melhor o sistema para ações de múltiplos usuários ao mesmo tempo evitando diversas race conditions.
- Deixaria o sistema de front end mais reativo e customizado, também implementando um sistema de usuário (registro/login/dados próprios).
- Sistema de pagamento integrado para realizar o pagamento do lote.
