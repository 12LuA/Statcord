<template>
  <div>
    <div class="row">
      <div class="col s7">
        <nuxt-img class="h-32 w-32 rounded-full" :alt="user.username+`'s profile picture`" :src="user.avatarURL" :placeholder="'https://cdn.discordapp.com/embed/avatars/'+(route.params.userID >>> 22) % 5+'.png?size=512'" />
        <h1>{{user.username}}</h1>
      </div>
    </div>
    <h4>{{ user.aboutme }}</h4>

    <div v-if="user.website">
      <safeLinkPopUp icon="link" name="Website" :url="user.website"></safeLinkPopUp>
    </div>
  </div>

  <h1>Bots</h1>
  <botlist :botsProvided="botListBots"></botlist>
</template>

<script setup>
  import { useRoute } from 'vue-router';
  const { $authRequest } = useNuxtApp()
  const route = useRoute()

  const userFetch = await $authRequest(`/api/user/${route.params.userID}`)
  if (userFetch === "404") throw createError({
    statusCode: 404,
    message: 'User not found'
  })
  if (userFetch === "401") throw createError({
    statusCode: 401,
    message: 'You do not have permission to veiw this user'
  })
  
  const user = {
    ...userFetch,
    avatarURL: `https://cdn.discordapp.com/avatars/${userFetch.avatar ? `${route.params.userID}/${userFetch.avatar}.${userFetch.avatar.startsWith("_a") ? '.gif' : 'webp'}`: `${(route.params.userID >>> 22) % 5}.png`}`
  }
  
  const botListBotsFetch = await $authRequest(`/api/user/${route.params.userID}/bots`)
  if (botListBotsFetch === "404") throw createError({
    statusCode: 404,
    message: 'User not found'
  })
  if (botListBotsFetch === "401") throw createError({
    statusCode: 401,
    message: 'You do not have permission to veiw this user'
  })
  const botListBots = botListBotsFetch

  useSeoMeta({
    themeColor: "#0080F0",
    title: 'User profile',
    description: "View a users profile on Statcord.",
    ogTitle: 'User profile',
    ogDescription: "View a users profile on Statcord.",
    ogImage: '/img/icon.png',
    ogUrl: 'https://statcord.com',
    twitterTitle: 'User profile',
    twitterDescription: "View a users profile on Statcord.",
    twitterImage: '/img/icon.png',
    twitterCard: 'summary'
  })
</script>
<script>
import botlist from '../../../components/botlist.vue'
import safeLinkPopUp from '../../../components/openLink.vue'

export default {
  name: 'userPage',
  components: {
    botlist,
    safeLinkPopUp
  },
  data() {
    return {
      userID: this.$route.params.userID
    };
  }
}
</script>