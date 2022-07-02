<div id="top"></div>

<div align="center">
  <h2 align="center">Akane</h3>

  <p align="center">
   Akane é um bot focado em moderação para comunidades de Discord com algumas funcionalidades extras.
    <br />
    <a href="#pré-requisitos">Pré-requisitos</a>
    ·
    <a href="#preparando-para-desenvolvimento">Desenvolvimento</a>
   ·
    <a href="#Preparando-para-rodar-em-produção">Produção</a>
  </p>
</div>

## Pré-requisitos

- [Node.js](https://nodejs.org/en/download/) ≥ 16.15.1
- [pnpm](https://pnpm.io/installation) ≥ 7.1.7
- [knexjs](https://github.com/knex/knex) ≥ 2.1.0
- [Docker](https://www.docker.com/) + [PostgreSQL](https://hub.docker.com/_/postgres/)

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

## Preparando para rodar em produção

TODO
