
package com.substring.chat.chat_app_backend.payload;

public class JoinRoomRequest {

    private String roomId;

    public JoinRoomRequest() {
    }

    public JoinRoomRequest(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }
}
