import postgres from 'postgres'

export default defineEventHandler((event) => {
    if (event.context.pgPool) return event.context.pgPool;

    const config = useRuntimeConfig(event)

    event.context.pgPool = postgres({
        ...config.configFile.postgresConfig,
        types: {
            // bigint: postgres.BigInt,
            rect: {
                to        : 1700,
                from      : [1700],
                serialize : x => '' + x,
                parse     : parseFloat
            }
        },
        // debug: function(connection, query, params, types){
        //     console.log(query)
        //     console.log(params)
        // }
    })
})