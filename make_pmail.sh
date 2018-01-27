#!/bin/bash

# Compile Index.java
echo -n "Compiling Index.java..."
javac -cp ./lib/json-simple-1.1.1.jar -d bin/ src/server/Index.java
echo "done!"

# Compile MyWebSocketHandler.java
echo -n "Compiling MyWebSocketHandler.java..."
javac -cp ./lib/jetty-distribution-9.3.5.v20151012/lib/*.jar:.:./lib/jetty-distribution-9.3.5.v20151012/lib/annotations/*:./lib/jetty-distribution-9.3.5.v20151012/lib/apache-jsp/*:./lib/jetty-distribution-9.3.5.v20151012/lib/apache-jstl/*:./lib/jetty-distribution-9.3.5.v20151012/lib/ext/*:./lib/jetty-distribution-9.3.5.v20151012/lib/fcgi/*:./lib/jetty-distribution-9.3.5.v20151012/lib/http2/*:./lib/jetty-distribution-9.3.5.v20151012/lib/jaspi/*:./lib/jetty-distribution-9.3.5.v20151012/lib/jndi/*:./lib/jetty-distribution-9.3.5.v20151012/lib/monitor/*:./lib/jetty-distribution-9.3.5.v20151012/lib/setuid/*:./lib/jetty-distribution-9.3.5.v20151012/lib/spring/*:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/*:./bin/ -d ./bin/ src/server/MyWebSocketHandler.java
echo "done!"

# Compile WebSocketTest.java
echo -n "Compiling WebSocketTest.java..."
javac -cp ./lib/jetty-distribution-9.3.5.v20151012/lib/jetty-server-9.3.5.v20151012.jar:.:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/websocket-server-9.3.5.v20151012.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/websocket-servlet-9.3.5.v20151012.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/jetty-util-9.3.5.v20151012.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/javax.websocket-api-1.0.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/javax-websocket-server-impl-9.3.5.v20151012.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/servlet-api-3.1.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/javax.websocket-api-1.0.jar:./lib/jetty-distribution-9.3.5.v20151012/lib/websocket/websocket-api-9.3.5.v20151012.jar:./bin/ -d bin/ src/server/WebSocketTest.java
echo "done!"
