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
    
    /**
     * Get bulk email status
     * Get the bulk email information like validation errors, failed emails and more.
     * Method must be GET
     * @param {string} bulk_email_id 
     * @returns {object} look at fields at https://developers.mailersend.com/api/v1/email.html#get-bulk-email-status
     */
    getBulkEmailStatus(bulk_email_id) {

        return this.doRequest({
            key: this.key,
            path: `/v1/bulk-email/${bulk_email_id}`,
            method: 'GET',
        });

    }

    /**
     * Get activities
     * 
     * usage:
     *     
     * const activityTest = mailersend.getActivity({
     *       date_from: '2022-12-01',
     *       date_to: '2022-12-01',
     *       today: true,
     *       yesterday: true,
     *       events: ['sent', 'processed', 'queued', 'delivered', 'soft_bounced', 'hard_bounced', 'junk', 'opened', 'clicked', 'unsubscribed', 'spam_complaints'],
     *       page: 1,
     *       limit: 100,
     *
     *  });  
     * 
     * @param {object} data look at input fields
     * @returns {object} data from fields at https://developers.mailersend.com/api/v1/activity.html#get-a-list-of-activities
     */
    getActivity(data) {

        var { date_from, date_to, today, yesterday, limit, page, events } = data;

        const queryParams = {};

        // detect data types, if entered
        if (typeof(date_from) !== 'undefined' && typeof(date_to) !== 'undefined') {
            // date format = '2022-11-01'
            date_from = Math.floor(new Date(new Date(date_from.split('-')).setHours(0, 0, 0)).getTime() / 1000);
            date_to = Math.floor(new Date(new Date(date_to.split('-')).setHours(23, 59, 59)).getTime() / 1000);
        } else if (typeof(today) !== 'undefined') {
            var date_from = Math.floor(new Date(new Date().setHours(0, 0, 0)).getTime() / 1000);
            var date_to = Math.floor(new Date(new Date().setHours(23, 59, 59)).getTime() / 1000);
        } else if (typeof(yesterday) !== 'undefined') {
            var date_from = Math.floor(new Date(new Date().setHours(-23, -59, -59)).getTime() / 1000);
            var date_to = Math.floor(new Date(new Date().setHours(0, 0, 0)).getTime() / 1000);
        } 
        
        // set parameters to query
        if (date_from) queryParams.date_from = date_from;
        if (date_to) queryParams.date_to = date_to;

        // detect page
        if (typeof(page) !== 'undefined') queryParams.page = page;

        // detect limit 
        if (typeof(limit) !== 'undefined') queryParams.limit = limit;

        // change object to string
        let stringQueryParams = _ObjToQueryString(queryParams);

        // add events in string 
        if (typeof(events) !== 'undefined') stringQueryParams += '&' + _ObjToQueryString(events, 'event');

        // return array object data
        return this.doRequest({
            key: this.key,
            path: `/v1/activity/${this.domainId}?${stringQueryParams}`,
            method: 'GET',
        }).data;
        
    }



    /**
     * Add some more methods
     */

}

function api(data) {
    return new MailerSend(data)
}

const  _flattenObject = (obj) => {
    const toReturn = {};

    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if ((typeof obj[i]) == 'object' && obj[i] !== null) {
            var flatObj = _flattenObject(obj[i]);
            for (var x in flatObj) {
                if (!flatObj.hasOwnProperty(x)) continue;
                toReturn[x] = flatObj[x];
            }
        } else {
            toReturn[i] = obj[i];
        }
    }
    return toReturn;
}; 

const _ObjToQueryString = (obj, type) => {

    if (typeof (type) !== 'undefined') {
        const newObj = [];
        obj.forEach((value, key) => {
            newObj.push({ [`${type}[${key}]`]: value });
        })
        obj = _flattenObject(newObj);
    }

    return Object.entries(obj).reduce((query, [key, value]) => {
        return `${query}${query ? '&' : ''}${key}=${value}`;
    }, '');
};
