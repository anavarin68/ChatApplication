package com.substring.chat.chat_app_backend.controllers;


import com.substring.chat.chat_app_backend.config.AppConstants;
import com.substring.chat.chat_app_backend.entities.Message;
import com.substring.chat.chat_app_backend.entities.Room;
import com.substring.chat.chat_app_backend.payload.MessagePageResponse;
import com.substring.chat.chat_app_backend.repositories.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin(AppConstants.FRONT_END_BASE_URL)
public class RoomController {

    private RoomRepository roomRepository;

    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    //create room
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody String roomId){
        if(roomRepository.findByRoomId(roomId)!=null){
            //room is already there
            return ResponseEntity.badRequest().body("Room already exists!");
        }

        System.out.println("Creating room: " + roomId);

        //create new room
        Room room = new Room();
        room.setRoomId(roomId);
        Room savedRoom = roomRepository.save(room);

        System.out.println("Saved room ID: " + savedRoom.getRoomId());
        System.out.println("MongoDB document ID: " + savedRoom.getId());

        Room verifiedRoom = roomRepository.findByRoomId(roomId);
        System.out.println("Found after save: " + (verifiedRoom != null));

        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }


    //get room
    @GetMapping("/{roomId}")
    public ResponseEntity<?> joinRoom( @PathVariable String roomId){
        Room room = roomRepository.findByRoomId((roomId));
        if(room==null){
            return ResponseEntity.badRequest()
                    .body("Room not found!!");
        }
        return ResponseEntity.ok(room);
    }


    //get messages of the  room
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<MessagePageResponse> getMessages(
            @PathVariable String roomId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size){

        if (size < 1 || size > 100) {
            return ResponseEntity.badRequest().build();
        }

        Room room = roomRepository.findByRoomId(roomId);

        if(room==null){
            return ResponseEntity.badRequest().build();
        }

        List<Message> messages = room.getMessages();
        boolean changed = false;
        for (Message message : messages) {
            if (message.getId() == null || message.getId().isBlank()) {
                message.setId(UUID.randomUUID().toString());
                changed = true;
            }
        }
        if (changed) {
            roomRepository.save(room);
        }

        int end = messages.size();
        if (cursor != null && !cursor.isBlank()) {
            end = -1;
            for (int index = 0; index < messages.size(); index++) {
                if (cursor.equals(messages.get(index).getId())) {
                    end = index;
                    break;
                }
            }
            if (end < 0) {
                return ResponseEntity.badRequest().build();
            }
        }

        int start = Math.max(0, end - size);
        List<Message> paginatedMessages = new ArrayList<>(messages.subList(start, end));
        boolean hasMore = start > 0;
        String nextCursor = hasMore ? paginatedMessages.get(0).getId() : null;
        return ResponseEntity.ok(
                new MessagePageResponse(paginatedMessages, hasMore, nextCursor));
    }


}
