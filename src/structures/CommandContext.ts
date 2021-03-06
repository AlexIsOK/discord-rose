import { APIGuildMember, APIMessage } from "discord-api-types";

import { Embed } from './Embed'
import { MessageTypes } from "../rest/resources/Messages";

import { CommandOptions, Worker } from '../typings/lib'

import { PermissionsUtils, bits } from '../utils/Permissions'

export class CommandContext {
  public args: string[] = []

  constructor (public worker: Worker, public message: APIMessage, public command: CommandOptions, public prefix: string) {}

  /**
   * Guild where the message was sent
   */
  get guild () {
    return this.worker.guilds.get(this.message.guild_id)
  }

  /**
   * Channel where the message was sent
   */
  get channel () {
    return this.worker.channels.get(this.message.channel_id)
  }

  /**
   * Member who sent the message
   */
  get member (): APIGuildMember {
    return {
      ...this.message.member,
      user: this.message.author
    }
  }
  
  /**
   * Bot's memeber within the guild
   */
  get me () {
    return this.worker.selfMember.get(this.message.guild_id)
  }

  /**
   * Replies to the invoking message
   * @param data Data for message
   */
  reply (data: MessageTypes) {
    return this.worker.api.messages.send(this.message.channel_id, data, {
      message_id: this.message.id,
      channel_id: this.message.channel_id,
      guild_id: this.message.guild_id
    })
  }

  /**
   * Sends a message in the same channel as invoking message
   * @param data Data for message
   */
  send (data: MessageTypes) {
    return this.worker.api.messages.send(this.message.channel_id, data)
  }

  /**
   * Sends a file to the same channel
   * @param file File buffer
   * @param extra Extra message options
   */
  sendFile (file: { name: string, buffer: Buffer }, extra?: MessageTypes) {
    return this.worker.api.messages.sendFile(this.message.channel_id, file, extra)
  }

  /**
   * Deletes the invoking message
   */
  delete () {
    return this.worker.api.messages.delete(this.message.channel_id, this.message.id)
  }

  /**
   * Makes an embed to send
   * @example
   * ctx.embed
   *   .title('Hello')
   *   .send()
   */
  get embed () {
    return new Embed((embed, reply) => {
      if (reply) return this.reply(embed)
      else return this.send(embed)
    })
  }

  hasPerms (perms: keyof typeof bits): boolean {
    return PermissionsUtils.calculate(this.member, this.guild, this.worker.guildRoles.get(this.guild.id), perms)
  }

  myPerms (perms: keyof typeof bits): boolean {
    return PermissionsUtils.calculate(this.me, this.guild, this.worker.guildRoles.get(this.guild.id), perms)
  }
}