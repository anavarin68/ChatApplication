
package com.substring.chat.chat_app_backend.payload;

public class LoginResponse {

    private String token;
    private String tokenType;
    private String id;
    private String name;
    private String email;

    public LoginResponse() {
    }

    public LoginResponse(
            String token,
            String tokenType,
            String id,
            String name,
            String email) {
        this.token = token;
        this.tokenType = tokenType;
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
