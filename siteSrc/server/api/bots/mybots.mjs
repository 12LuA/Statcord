import { defineEventHandler, getQuery, createError } from "h3"

export default defineEventHandler(async event => {
	if (!event.context.session.accessToken) throw createError({
		statusCode: 401
	})

	return event.context.pgPool`SELECT username, avatar, botid, nsfw FROM bots WHERE ownerid = ${event.context.session.userInfo.id} LIMIT 30 OFFSET 30*${Number(getQuery(event).page ?? 0)}`.catch().catch(() => {})
})

export const schema = {
	method: "GET",
	url: "/api/bots/mybots",
	schema: {
        hide: true,
        querystring: {
			page: { type: "number", default: 0 }
        },
        response: {
			401: {},
            200: {
                type: "array",
                items: {
					type: "object",
					properties: {
						botid: { type: "string" },
						username: { type: "string" },
						avatar: { type: "string" }
					}
				}
            }
        }
	}
}
