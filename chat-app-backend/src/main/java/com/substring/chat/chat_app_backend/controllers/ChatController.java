package com.substring.chat.chat_app_backend.controllers;


import com.substring.chat.chat_app_backend.config.AppConstants;
import com.substring.chat.chat_app_backend.entities.Message;
import com.substring.chat.chat_app_backend.entities.Room;
import com.substring.chat.chat_app_backend.payload.MessageRequest;
import com.substring.chat.chat_app_backend.repositories.RoomRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;

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
            @RequestBody MessageRequest request
    ) {


        Room room = roomRepository.findByRoomId(request.getRoomId());

        Message message = new Message();
        message.setContent(request.getContent());
        message.setSender(request.getSender());
        message.setTimeStamp(LocalDateTime.now());

        if (room != null) {
            room.getMessages().add(message);
            roomRepository.save(room);
        } else {
            throw new RuntimeException("room not found!!");
        }


        return message;
    }
}
