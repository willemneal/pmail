package server;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.websocket.server.WebSocketHandler;
import org.eclipse.jetty.websocket.servlet.WebSocketServletFactory;

public class WebSocketTest {
	private static int PORT = 8080;

	public static void main(String[] args) throws Exception {
		int port = (args.length == 0) ? PORT : Integer.parseInt(args[0]);
		Server server = new Server(port);
		WebSocketHandler wsHandler = new WebSocketHandler() {
			@Override
			public void configure(WebSocketServletFactory factory) {
				factory.register(MyWebSocketHandler.class);
			}
		};
		server.setHandler(wsHandler);
		server.start();
		server.join();
	}
}
