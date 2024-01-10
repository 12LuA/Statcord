import { defineEventHandler, sendRedirect, getQuery, createError} from "h3"

export default defineEventHandler(async event => {
    const { code, state } = getQuery(event);
    if (!code) throw createError({
        statusCode: 400
    })

    const {tokens, redirect} = await event.context.oauth.exchangeCode({
        code
    })

    if (!tokens?.accessToken) throw createError({
        statusCode: 400
    })

    const OAuthHelper = event.context.oauth.rest.oauth.getHelper(`Bearer ${tokens.accessToken}`)
    const userInfo = (await OAuthHelper.getCurrentAuthorizationInformation()).user;


    // accessToken: 'QtKOY9TH3oAnpAa',
    // expiresIn: 604800,
    // refreshToken: '0tAWgcNjG5W',
    // scopes: [ 'applications.builds.read', 'identify' ],
    // tokenType: 'Bearer',
    // webhook: null

    event.context.session.accessToken = tokens.accessToken,
    event.context.session.userInfo = userInfo
    
    event.context.pgPool`INSERT INTO owners(username, ownerid, avatar) VALUES (${userInfo.username}, ${userInfo.id}, ${userInfo.avatar}) ON CONFLICT (ownerid) DO UPDATE SET username = ${userInfo.username}, avatar = ${userInfo.avatar}`.catch(() => {})

    return sendRedirect(event, `${redirect}${state}`, 302)
})

export const schema = {
    // querystring: {
    //     code: { type: "string" }
    // },
    hidden: true,
	tags: [
		"Internal"
	],
    responses: {
        302: {}
    }
}