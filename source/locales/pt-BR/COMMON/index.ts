import type { BaseTranslation } from "../../i18n-types";

const pt_BR_common: BaseTranslation = {
  LAST_7_DAYS: "Últimos 7 dias",
  LAST_24_HOURS: "Últimas 24 horas",
  TOTAL: "Total",

  INFRACTIONS_OF: "Infrações de {user:string}",
  USER_HAS_NO_INFRACTIONS: "Este usuário não possui infrações neste servidor.",
  X_INFRACTIONS: "{count:number} infrações.",

  // Command-specific translations

  MODERATION_BAN_SUCCESS: "O usuário {user:string} foi banido com sucesso deste servidor.",
  MODERATION_BAN_SUCCESS_AND_FAIL_SEND_DM: "O usuário {user:string} foi banido com sucesso deste servidor, mas eu não consegui enviar um DM ao usuário.",
  MODERATION_BAN_SUCCESS_SILENT: "O usuário {user:string} foi banido com sucesso deste servidor, mas eu não consegui enviar um DM ao usuário.",

  MODERATION_KICK_SUCCESS: "Usuário expulso com sucesso.",
  MODERATION_KICK_SUCCESS_AND_FAIL_SEND_DM: "Usuário expulso com sucesso, mas não foi possível enviar a MD do usuário.",
  MODERATION_KICK_SUCCESS_SILENT: "Usuário expulso com sucesso sem o notificar via MD.",

  MODERATION_WARN_SUCCESS: "O usuário foi avisado.",
  MODERATION_WARN_SUCCESS_AND_FAIL_SEND_DM: "O usuário foi avisado, mas não foi possível enviar a MD do usuário.",
  MODERATION_WARN_SUCCESS_SILENT: "O usuário foi avisado e não foi notificado via MD.",
};

export default pt_BR_common;
