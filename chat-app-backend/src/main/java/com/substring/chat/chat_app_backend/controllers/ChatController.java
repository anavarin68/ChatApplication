package com.substring.chat.chat_app_backend.controllers;


import com.substring.chat.chat_app_backend.config.AppConstants;
import com.substring.chat.chat_app_backend.entities.Message;
import com.substring.chat.chat_app_backend.entities.Room;
import com.substring.chat.chat_app_backend.payload.MessageRequest;
import com.substring.chat.chat_app_backend.repositories.RoomRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDateTime;

@Controller
@CrossOrigin(AppConstants.FRONT_END_BASE_URL)
public class ChatController {

    private RoomRepository roomRepository;

    public ChatController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    //for sending and receiving messages
    @MessageMapping("/sendMessage/{roomId}")   // /app/sendMessage/roomId
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            @Payload MessageRequest request
    ) {

        // Validate the destination room ID
        if (roomId == null || roomId.isBlank()) {
            throw new IllegalArgumentException(
                    "Room ID must not be empty");
        }

        if (request == null
                || request.getRoomId() == null
                || request.getRoomId().isBlank()) {
            throw new IllegalArgumentException(
                    "Message room ID must not be empty");
        }

        // Prevent saving a message to a different room
        if (!roomId.equals(request.getRoomId())) {
            throw new IllegalArgumentException(
                    "Message room ID does not match destination room");
        }


        Room room = roomRepository.findByRoomId(request.getRoomId());

        if (room == null) {
            throw new IllegalArgumentException("Room not found");
        }

        Message message = new Message();
        message.ensureId();
        message.setContent(request.getContent());
        message.setSender(request.getSender());
        message.setTimeStamp(LocalDateTime.now());

        room.getMessages().add(message);
        roomRepository.save(room);

        return message;
    }
}
