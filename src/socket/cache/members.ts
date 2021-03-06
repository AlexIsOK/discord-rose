import Collection from '@discordjs/collection';
import { GatewayGuildMemberAddDispatchData } from 'discord-api-types';
import Worker from '../../clustering/worker/Worker';
import { CacheManager } from '../CacheManager';

export function members (events: CacheManager, worker: Worker) {
  worker.members = new Collection()

  events.add('GUILD_MEMBER_ADD', (member) => {
    let guildMembers = worker.members.get(member.guild_id)
    if (!guildMembers) {
      guildMembers = new Collection()
      worker.members.set(member.guild_id, guildMembers)
    }

    if (worker.options.cacheControl.members) {
      const newMember = {} as GatewayGuildMemberAddDispatchData
      worker.options.cacheControl.members.forEach(key => {
        newMember[key] = member[key] as never
      })
      newMember.guild_id = member.guild_id
      newMember.user = member.user
      member = newMember
    }

    guildMembers.set(member.user.id, member)
  })

  events.add('GUILD_MEMBER_UPDATE', (member) => {
    let guildMembers = worker.members.get(member.guild_id)
    if (!guildMembers) return
    let currentMember = guildMembers.get(member.user.id)
    if (!currentMember) return

    currentMember.nick = member.nick
    currentMember.roles = member.roles

    if (worker.options.cacheControl.members) {
      const newMember = {} as GatewayGuildMemberAddDispatchData
      worker.options.cacheControl.members.forEach(key => {
        newMember[key] = currentMember[key] as never
      })
      newMember.guild_id = member.guild_id
      newMember.user = member.user
      currentMember = newMember
    }

    guildMembers.set(member.user.id, currentMember)
  })

  events.add('GUILD_MEMBER_REMOVE', (member) => {
    let guildMembers = worker.members.get(member.guild_id)
    if (!guildMembers) return

    guildMembers.delete(member.user.id)
  })

  events.add('GUILD_DELETE', (guild) => {
    if (guild.unavailable) return

    worker.members.delete(guild.id)
  })
}