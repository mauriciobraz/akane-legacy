import { randomUUID } from "crypto";
import {
  Collection,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
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

  type RepliableInteraction<Type extends CacheType | undefined = undefined> = Interaction<Type> &
    InteractionResponseFields<Type>;

  const IdSeparator = "&";

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

  /**
   * Ask the user a question using buttons and return the user's response.
   * @param interaction The interaction to use for the inquirer.
   * @param options Configuration options for the inquirer.
   * @returns The id of the selected choice.
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
    return getChoiceById(options.choices, choiceUniqueId).id as unknown as ReturnType;
  }

  export interface SelectValue extends BaseValue {
    /** Label to display on the button. */
    label: string;

    /** Description to display on the choice. */
    description?: string;

    /** Emoji to display on the choice. */
    emoji?: string;
  }

  export interface SelectInquirerOptions extends BaseOptions<SelectValue> {
    /** Select menu's placeholder text. */
    placeholder: string;

    /** Should the menu be disabled? */
    setDisabledWhenDone?: boolean;

    /**
     * Message to edit the original message with when the user selects this button. When undefined,
     * the message will be deleted
     */
    postAnswerMessage?: string;
  }

  /**
   * Ask the user a question using a select menu and return the user's response.
   * @param interaction The interaction to use for the inquirer.
   * @param options Configuration options for the inquirer.
   * @returns The id of the selected choice.
   */
  export async function askUsingSelectMenu<
    T extends SelectInquirerOptions,
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

    const opts = options.choices.map(
      (choice): MessageSelectOptionData => ({
        label: choice.label,
        value: choice.id.toString(),
        description: choice.description,
        emoji: choice.emoji,
      })
    );

    const selectMenu = new MessageSelectMenu()
      .setPlaceholder(options.placeholder)
      .setCustomId(uuid)
      .setOptions(opts);

    const actionRow = new MessageActionRow().addComponents(selectMenu);

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
      componentType: "SELECT_MENU",
      filter: component => component.customId === uuid && component.user.id === interaction.user.id,
    });

    await answer.deferUpdate();

    if (options.postAnswerMessage) {
      if (options.setDisabledWhenDone) {
        selectMenu.setDisabled(true);
      }

      options.context === Context.Guild
        ? await interaction.editReply({
            components: [new MessageActionRow().addComponents(selectMenu)],
            content: options.postAnswerMessage,
          })
        : await message.edit({
            components: [new MessageActionRow().addComponents(selectMenu)],
            content: options.postAnswerMessage,
          });
    } else {
      if (options.context === Context.Guild) {
        if (options.setDisabledWhenDone) {
          selectMenu.setDisabled(true);

          await interaction.editReply({
            components: [new MessageActionRow().addComponents(selectMenu)],
          });
        }
      } else {
        await message.delete();
      }
    }

    const choice = getChoiceById(options.choices, answer.values[0]);

    if (!choice) {
      throw new Error("No choice found for selected value.");
    }

    return choice.id as unknown as ReturnType;
  }

  export interface AskMessageInquirerOptions extends Omit<BaseOptions<unknown>, "choices"> {
    /** Maximum number of messages to retrieve. */
    maxMessages?: number;

    /** Timeout for the message. */
    timeout?: number;

    /** Delete the message used to ask the user a question. */
    deleteQuestion?: boolean;

    /** Delete the retrieved messages after receiving the answer. */
    deleteRetrievedMessages?: boolean;
  }

  export async function askMessages<T extends AskMessageInquirerOptions>(
    interaction: RepliableInteraction<CacheType>,
    options: T
  ): Promise<Collection<string, Message>> {
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

    const message = (
      options.context === Context.Guild
        ? await interaction.editReply(options.question)
        : await channel.send(options.question)
    ) as Message<boolean>;

    const messages = await channel.awaitMessages({
      max: options.maxMessages,
      time: options.timeout,
      errors: ["time"],
      filter: message => message.author.id === interaction.user.id,
    });

    const messagesClone = messages.clone();

    if (options.deleteRetrievedMessages) {
      for await (const [, message] of messages) {
        await message.delete();
      }
    }

    if (options.deleteQuestion && options.context === Context.DM) {
      if (message.deletable) {
        await message.delete();
      }
    }

    return messagesClone;
  }

  /**
   * Utility function to get the id of a choice from a unique id.
   * @param choices Array of choices to choose from.
   * @param choice Unique ID of the choice to find.
   * @returns The unique ID of the found choice.
   * @internal
   */
  function getChoiceById<T extends BaseValue>(choices: T[], choice: any): T {
    return choices.find(c => {
      if (typeof c.id === "string") {
        return c.id === choice;
      } else if (typeof c.id === "number") {
        return c.id === parseInt(choice, 10);
      } else if (typeof c.id === "boolean") {
        return c.id === Boolean(c);
      }
    });
  }
}

export const Context = Inquirer.Context;
