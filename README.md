<div id="top"></div>

<div align="center">
  <h3 align="center">Akane</h3>

  <p align="center">
   Akane é um bot para Discord ainda em desenvolvimento com foco em moderação.
    <br />
    <a href="MILESTONES.md"><strong>Explore the Milestones »</strong></a>
    <br />
    <br />
    <a href="#padrão-de-código">Padrão de Código</a>
    ·
    <a href="#estrutura-de-pastas">Estrutura de Pastas</a>
    ·
    <a href="#develpoment">Desenvolvimento</a>
  </p>
</div>

## Padrão de Código

1. Use `namespaces` para organizar o código invés de classes ou metódos com nomes longos.
2. Documente o máximo de código possível, mas, obviamente, não faça documentação inútil.
3. Nomeie tudo de forma explícita sobre o que X é/faz.
4. Siga o padrão de [Estrutura de Pastas](#estrutura-de-pastas).
5. Use tipagem explicita e o máximo que puder.
6. Prefira usar funções/métodos

## Estrutura de Pastas

- `.env`: Variáveis de ambiente, cheque antes de executar.
- `source/`
  - `index.ts`: Código relacionado a inicialização do projeto.
  - `types.ts`: Tipagens compartilhadas pelo projeto.
  - `modules/`: Módulos do bot, por ex. comandos e eventos.
  - `utils/` : Funções utilitárias.

## Pré-requisitos

- [Node.js](https://nodejs.org/en/download/) ≥ 16.15.1
- [pnpm](https://pnpm.io/installation) ≥ 7.1.7

## Preparando para desenvolvimento

1. Clone o repositório do projeto.

   ```sh-session
   git clone git@github.com:mauriciobraz/akane.git
   cd akane
   ```

2. Instale as dependências com `pnpm`.

   ```sh-session
   pnpm install
   ```

3. Clone o arquivo `.env.example` para `.env` e substitua os valores padrão pelos seus respectivos.

   ```sh-session
   cp .env.example .env
   ```

4. Por fim, rode o script de inicialização em modo de desenvolvimento.
   ```sh-session
   npm run dev
   ```
