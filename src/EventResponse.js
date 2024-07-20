class EventResponse {
    constructor(success = true, message = "Success", data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}

module.exports = EventResponse;