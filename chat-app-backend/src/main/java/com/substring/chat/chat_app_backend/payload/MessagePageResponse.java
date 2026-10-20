package com.substring.chat.chat_app_backend.payload;

import com.substring.chat.chat_app_backend.entities.Message;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class MessagePageResponse {
    private List<Message> messages;
    private boolean hasMore;
    private String nextCursor;
}
