// Invokes an existing Express route handler in-process.
//
// The services used to reach each other over HTTP (AUTH_SERVICE, CHAT_SERVICE, ...).
// Now that every service runs inside one Express app, those calls become direct
// function calls. Handlers keep working unchanged because they only use
// req.body / req.params / req.headers and respond via res.status().json().
export const callHandler = (handler, { body, params, headers } = {}) =>
    new Promise((resolve, reject) => {
        const req = {
            body: body ?? {},
            params: params ?? {},
            headers: headers ?? {}
        }

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code
                return this
            },
            json(payload) {
                resolve({ status: this.statusCode, data: payload })
                return this
            }
        }

        Promise.resolve(handler(req, res)).catch(reject)
    })
