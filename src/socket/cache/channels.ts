import Collection from '@discordjs/collection';
import { APIChannel } from 'discord-api-types';
import Worker from '../../clustering/worker/Worker';
import { CacheManager } from '../CacheManager';

export function channels (events: CacheManager, worker: Worker) {
  worker.channels = new Collection()

  events.add('CHANNEL_CREATE', (channel) => {
    if (worker.options.cacheControl.channels) {
      const newChannel = {} as APIChannel
      worker.options.cacheControl.channels.forEach(key => {
        newChannel[key] = channel[key] as never
      })
      newChannel.guild_id = channel.guild_id
      newChannel.id = channel.id
      channel = newChannel
    }
    worker.channels.set(channel.id, channel)
  })

  events.add('CHANNEL_UPDATE', (channel) => {
    let currentChannel = worker.channels.get(channel.id)
    if (!currentChannel) return

    currentChannel.name = channel.name
    currentChannel.type = channel.type
    currentChannel.position = channel.position
    currentChannel.topic = channel.topic
    currentChannel.nsfw = channel.nsfw
    currentChannel.rate_limit_per_user = channel.rate_limit_per_user
    currentChannel.bitrate = channel.bitrate
    currentChannel.user_limit = channel.user_limit
    currentChannel.permission_overwrites = channel.permission_overwrites
    currentChannel.parent_id = channel.parent_id
    
    if (worker.options.cacheControl.channels) {
      const newChannel = {} as APIChannel
      worker.options.cacheControl.channels.forEach(key => {
        newChannel[key] = channel[key] as never
      })
      newChannel.guild_id = channel.guild_id
      newChannel.id = channel.id
      currentChannel = newChannel
    }
    
    worker.channels.set(channel.id, currentChannel)
  })

  events.add('CHANNEL_DELETE', (channel) => {
    worker.channels.delete(channel.id)
  })

  events.add('GUILD_DELETE', (guild) => {
    if (guild.unavailable) return

    worker.channels.filter(x => x.guild_id === guild.id)
      .forEach(x => worker.channels.delete(x.id))
  })
}