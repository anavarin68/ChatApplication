package com.substring.chat.chat_app_backend.repositories;

import com.substring.chat.chat_app_backend.entities.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room,String> {
    //get room using roomid
    Room findByRoomId(String roomId);
}
