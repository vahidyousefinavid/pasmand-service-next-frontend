export const API = {
    SIGN_UP: "/api/serviceProvider/login",
    // Every city's price list, unscoped — kept for anything that genuinely
    // wants all of them.
    GET_MATERIAL: "/api/recyclableMaterials",
    // The signed-in collector's own city. This is what the app should read:
    // weighing a pickup against another city's tariff pays the wrong amount.
    MY_MATERIALS: "/api/recyclableMaterials/mine",
    GET_REQUESTS: "/api/serviceProvider/getRequests",
    UPDATE_REQUESTS: "/api/request/update",
    COLLECT_REQUESTS: "/api/request/collect",
    GET_PENDING_REQUESTS: "/api/serviceProvider/getPendingRequests",
    UPDATE_ITEMS_REQUESTS: "/api/request/updateItemsRequest",
    SAVE_SUBSCRIPTION: "/api/subscription/saveSubscription",
    DELETE_SUBSCRIPTION: "/api/subscription/deleteSubscription",
    NEW_REQUEST: "/api/v1/new-request",
    USER_REQUESTS: "/api/v1/user-requests",
    GET_PROFILE: "/api/serviceProvider/getProfile",
    // Was /api/v1/update-profile — the citizen API's path, which this backend
    // does not serve, so saving the profile always failed.
    UPDATE_PROFILE: "/api/serviceProvider/updateProfile",
    ADD_ADDRESS: "/api/v1/add-user-address",
    DELETE_ADDRESS: "/api/v1/remove-user-address",

    // The conversation attached to one request, shared with the citizen app.
    CHAT_MESSAGES: "/api/chat/messages",
    CHAT_UNREAD: "/api/chat/unread",
    // Every conversation at once, for the پیام‌ها screen.
    CHAT_THREADS: "/api/chat/threads",
    NOTIFICATIONS: "/api/notifications",
    NOTIFICATIONS_READ: "/api/notifications/read",
}
