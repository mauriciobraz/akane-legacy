import dedent from "ts-dedent";

import type { BaseTranslation } from "../../i18n-types";

const pt_BR_errors: BaseTranslation = {
  BOT_MISSING_PERMISSIONS: "Este comando que eu tenha a{{s}} seguinte{{s}} {{permissão|permissões}}: {permissions:string[]|joinArray}.",
  BOT_ROLE_INFERIOR_THAN_TARGET: "Este usuário possui um cargo com hierarquia superior a minha.",
  INVALID_TIME_FORMAT: "O tempo que você mandou ({0:string}) não é um formato válido. Use o formato `<tempo><unidade>`.",
  NO_REASON_PROVIDED: "Nenhum motivo foi fornecido.",
  NOT_IMPLEMENTED: "Este comando ainda não foi implementado.",
  NOT_IN_GUILD: "Este comando só pode ser usado em servidores.",
  NOT_TRUSTED_URL: dedent`
    Uma das URLs que você forneceu não é aceita por um dos seguintes motivos:
        1. o domínio não é aceito.
        2. não é termina com uma extensão de imagem/vídeo válida.
  `,
  TARGET_ROLE_HIGHER: "Este usuário possui um cargo superior ao seu.",
  TIME_EXCEEDS_MAX_LENGTH: "O tempo que você mandou ({0:number} carácteres) excede o limite de {1:number}.",
  UNKNOWN_ERROR: "Ocorreu um erro desconhecido, reporte isso ao desenvolvedor ou tente novamente mais tarde.",
  USER_MISSING_PERMISSIONS: "Você não possui a{{s}} seguinte{{s}} {{permissão|permissões}}: {permissions:string[]|joinArray}.",
  USER_TRYING_TO_PUNISH_HIMSELF: "Ei... você não pode punir você mesmo.",
};

export default pt_BR_errors;
