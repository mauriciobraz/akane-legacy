import type { BaseTranslation } from "../../i18n-types";

const pt_BR_embeds: BaseTranslation = {
  COMMON_BUTTONS: {
    CONTEST_PUNISHMENT: "Contestar punição",
  },

  COMMON_FOOTER: {
    CONTEST_PUNISHMENT: "Acha que esta punição é injusta? Conteste clicando no botão abaixo.",
  },

  MODERATION_BAN_TARGET_NOTIFICATION: {
    TITLE: "🔨 Você foi banido do servidor {guild:string}",
    DESCRIPTION: "Você foi banido do servidor {guild:string} por {moderator:string} com o motivo: {reason:string}",
  },

  MODERATION_KICK_TARGET_NOTIFICATION: {
    TITLE: "📰 Você foi expulso do servidor {guild:string}.",
    DESCRIPTION: "Você foi expulso do servidor por {moderator:string} pelo motivo {reason:string}.",
  },

  MODERATION_WARN_TARGET_NOTIFICATION: {
    TITLE: "📰 Você foi advertido no servidor {guild:string}.",
    DESCRIPTION: "Você foi advertido no servidor {guild:string} por {moderator:string} pelo motivo *{reason:string}*.",
  },
};

export default pt_BR_embeds;
