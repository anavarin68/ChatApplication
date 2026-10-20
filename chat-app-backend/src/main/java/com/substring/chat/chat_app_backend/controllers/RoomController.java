package com.substring.chat.chat_app_backend.controllers;


import com.substring.chat.chat_app_backend.config.AppConstants;
import com.substring.chat.chat_app_backend.entities.Message;
import com.substring.chat.chat_app_backend.entities.Room;
import com.substring.chat.chat_app_backend.repositories.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(value ="page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size){

        Room room = roomRepository.findByRoomId(roomId);
        if(room==null){
            return ResponseEntity.badRequest().build();
        }


        //get messages
        //pagination
        List<Message> messages= room.getMessages();
        int start = Math.max(0, messages.size() - (page + 1) * size);
        int end = Math.min(messages.size(), start+size);
        List<Message> paginatedMessages = messages.subList(start,end);
        return ResponseEntity.ok(messages);
    }


}
