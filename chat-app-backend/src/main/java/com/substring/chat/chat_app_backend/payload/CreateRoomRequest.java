
package com.substring.chat.chat_app_backend.payload;

public class CreateRoomRequest {

    private String name;

    public CreateRoomRequest() {
    }

    public CreateRoomRequest(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
