package com.substring.chat.chat_app_backend.controllers;


import com.substring.chat.chat_app_backend.config.AppConstants;
import com.substring.chat.chat_app_backend.entities.Message;
import com.substring.chat.chat_app_backend.entities.Room;
import com.substring.chat.chat_app_backend.payload.MessagePageResponse;
import com.substring.chat.chat_app_backend.repositories.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.substring.chat.chat_app_backend.entities.User;
import com.substring.chat.chat_app_backend.payload.CreateRoomRequest;
import com.substring.chat.chat_app_backend.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.substring.chat.chat_app_backend.payload.JoinRoomRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin(AppConstants.FRONT_END_BASE_URL)
public class RoomController {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public RoomController(
            RoomRepository roomRepository,
            UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    //create room
    @PostMapping
    public ResponseEntity<?> createRoom(
            @RequestBody CreateRoomRequest request,
            Authentication authentication) {

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Room name is required.");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found."));

        String roomId = UUID.randomUUID().toString();

        Room room = new Room();
        room.setRoomId(roomId);
        room.setName(request.getName().trim());
        room.setCreatedBy(user.getId());
        room.setMemberIds(new ArrayList<>(List.of(user.getId())));
        room.setMessages(new ArrayList<>());

        Room savedRoom = roomRepository.save(room);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRoom);
    }

    //get all rooms joined by a particular user
    @GetMapping("/my-rooms")
    public ResponseEntity<?> getMyRooms(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        List<Room> rooms =
                roomRepository.findByMemberIdsContaining(user.getId());

        return ResponseEntity.ok(rooms);
    }


    //get room
    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoom(
            @PathVariable String roomId,
            Authentication authentication) {

        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Room not found.");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null || room.getMemberIds() == null
                || !room.getMemberIds().contains(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not a member of this room.");
        }

        return ResponseEntity.ok(room);
    }

    //joinroom with invitation id
    @PostMapping("/join")
    public ResponseEntity<?> joinExistingRoom(
            @RequestBody JoinRoomRequest request,
            Authentication authentication) {

        if (request.getRoomId() == null || request.getRoomId().isBlank()) {
            return ResponseEntity.badRequest().body("Room ID is required.");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        Room room = roomRepository.findByRoomId(request.getRoomId().trim());

        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Room not found.");
        }

        if (room.getMemberIds() == null) {
            room.setMemberIds(new ArrayList<>());
        }

        if (room.getMemberIds().contains(user.getId())) {
            return ResponseEntity.ok("You are already a member of this room.");
        }

        room.getMemberIds().add(user.getId());
        Room updatedRoom = roomRepository.save(room);

        return ResponseEntity.ok(updatedRoom);
    }


    //get messages of the  room
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<MessagePageResponse> getMessages(
            @PathVariable String roomId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        if (size < 1 || size > 100) {
            return ResponseEntity.badRequest().build();
        }

        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null || room.getMemberIds() == null
                || !room.getMemberIds().contains(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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
