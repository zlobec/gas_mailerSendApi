/**
 * const response = MailerSend.api({ key: ENV.mailerSend.key });
 */

class MailerSend {
    constructor(obj = {}) {
        if (typeof obj == "string") {
            data = JSON.parse(obj);
        }
        Object.assign(this, obj);
    }

    doRequest(data) {

        const {
            path,
            method = 'GET',
            headers,
            payload,
        } = data;

        const options = {
            muteHttpExceptions: false,
            method,
            headers: {
                "Authorization": `Bearer ${this.key}`,
                "X-Requested-With": "XMLHttpRequest",
                "Content-type": "application/json",
            },
        };

        // need to add querystring here for GET requests
        const url = `https://api.mailersend.com${path}`;


        // if (headers) options.headers = headers;
        if (payload && !['GET'].includes(method)) options.payload =  JSON.stringify(payload);


        let response = '';
        try {
            response = UrlFetchApp.fetch(url, options);

            if (this.headersPlease) return response.getHeaders();
            
            return JSON.parse(response);
        } catch (err) {
            return { err, response };
        }

    }

    /**
     * usage:
     * 
     * 
     * response.sendBulkEmail(emails);
     * 
     * @param {object} payload method must be POST, look for payload fields at bulk-email API documentation at https://developers.mailersend.com/api/v1/email.html#send-bulk-emails 
     * @returns {response}
     */
    sendBulkEmail(payload) {

        return this.doRequest({
            key: this.key,
            path: '/v1/bulk-email',
            method: 'POST',
            payload: payload
        });
           
    }

}

function api(data) {
    return new MailerSend(data)
}