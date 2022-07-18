import { randomUUID } from "crypto";
import {
  MessageActionRow,
  MessageButton,
  type CacheType,
  type Interaction,
  type InteractionResponseFields,
  type Message,
} from "discord.js";

export namespace Inquirer {
  /** Context where the bot should ask the user for input. */
  export enum Context {
    Guild = "Guild",
    DM = "DM",
  }

  export interface BaseOptions<T> {
    /** Question to ask the user. */
    question: string;

    /** Available choices for the user to select. */
    choices: T[];

    /** Context of the question. Defaults to `Context.Guild`. */
    context: Context;
  }

  export interface BaseValue {
    /** Unique identifier for this value. */
    id: string | number | boolean;
  }

  export interface ButtonValue extends BaseValue {
    /** Label to display on the button. */
    label: string;

    /** What style to use for the button. */
    style: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";

    /** Emoji to display on the button. */
    emoji?: string;
  }

  export interface ButtonInquirerOptions extends BaseOptions<ButtonValue> {
    /** Should the button be disabled? */
    setButtonsDisabled?: boolean;

    /**
     * Message to edit the original message with when the user selects this button. When undefined,
     * the message will be deleted
     */
    postAnswerMessage?: string;
  }

  type RepliableInteraction<Type extends CacheType | undefined = undefined> = Interaction<Type> &
    InteractionResponseFields<Type>;

  const IdSeparator = "&";

  /**
   * Ask the user a question using buttons and return the user's response.
   * @param interaction The interaction to use for the inquirer.
   * @param options Configuration options for the inquirer.
   */
  export async function askUsingButtons<
    T extends ButtonInquirerOptions,
    ReturnType = T["choices"][number]["id"]
  >(interaction: RepliableInteraction<CacheType>, options: T): Promise<ReturnType> {
    const uuid = randomUUID();

    const channel =
      options.context === Context.Guild
        ? interaction.channel
        : interaction.user.dmChannel || (await interaction.user.createDM());

    if (!channel.isText()) {
      throw new Error("Cannot send message to non-text channel.");
    }

    if (interaction.inGuild() && !interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const buttons = options.choices.map(choice =>
      new MessageButton()
        .setLabel(choice.label)
        .setStyle(choice.style)
        .setEmoji(choice.emoji)
        .setCustomId(`${uuid}${IdSeparator}${choice.id}`)
    );

    const actionRow = new MessageActionRow().addComponents(buttons);

    const message = (
      options.context === Context.Guild
        ? await interaction.editReply({
            components: [actionRow],
            content: options.question,
          })
        : await channel.send({
            components: [actionRow],
            content: options.question,
          })
    ) as Message<boolean>;

    const answer = await channel.awaitMessageComponent({
      componentType: "BUTTON",
      filter: component =>
        component.customId.startsWith(`${uuid}${IdSeparator}`) &&
        component.user.id === interaction.user.id,
    });

    await answer.deferUpdate();

    if (options.postAnswerMessage) {
      if (options.setButtonsDisabled) {
        buttons.forEach(button => button.setDisabled(true));
      }

      options.context === Context.Guild
        ? await interaction.editReply({
            components: [new MessageActionRow().addComponents(buttons)],
            content: options.postAnswerMessage,
          })
        : await message.edit({
            components: [new MessageActionRow().addComponents(buttons)],
            content: options.postAnswerMessage,
          });
    } else {
      options.context === Context.Guild && (await channel.delete());
    }

    const [, choiceUniqueId] = answer.customId.split(IdSeparator);

    return options.choices.find(choice => {
      if (typeof choice.id === "string") {
        return choice.id === choiceUniqueId;
      } else if (typeof choice.id === "number") {
        return choice.id === Number(choiceUniqueId);
      } else if (typeof choice.id === "boolean") {
        return choice.id === Boolean(choiceUniqueId);
      }
    }).id as unknown as ReturnType;
  }
}

export const Context = Inquirer.Context;
