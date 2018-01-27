package server;

import java.io.IOException;
import java.util.Map;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketError;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;

@WebSocket
public class MyWebSocketHandler {

	public static final int ERR_USAGE = -1;
	public static final int ERR_UNRECOG_CMD = ERR_USAGE - 1;
	public static final int ERR_USER_DNE = ERR_UNRECOG_CMD - 1;
	public static final int ERR_INVALID_UPDATE = ERR_USER_DNE - 1;
	public static final int ERR_SEND_IDS = ERR_INVALID_UPDATE - 1;

	public static final String USAGE = "<Server_Socket> <port_to_listen>";
	public static final String CMD_UPDATE = "update";
	public static final String CMD_SEARCH = "search";
	public static final String CMD_CONNECT = "connect";
	public static final String INDEX_EXT = ".ind";
	public static final String DELIMITER = "%%";

	public static String PATH_TO_INDICES = "./";

	// Session variables
	private static Index index = null;
	private static String username = null;

	@OnWebSocketClose
	public void onClose(int statusCode, String reason) {
		System.out
				.println("Close: statusCode=" + statusCode + ", reason=" + reason);
		// Save the index to file
		index.save(PATH_TO_INDICES + username + INDEX_EXT);
	}

	@OnWebSocketError
	public void onError(Throwable t) {
		System.err.println("Error: " + t.getMessage());
	}

	/*
	 * Connect to site.com/server?username=<username>
	 * This will give the username onConnect where we can load the existing
	 * index
	 */

	@OnWebSocketConnect
	public void onConnect(Session session) {
		System.out
				.println("Connect: " + session.getRemoteAddress().getHostString());
		try {
			session.getRemote().sendString("Connected to Pmail Server");
			// This should print out the any query string from the client-side
			String q = session.getUpgradeRequest().getQueryString();
			username = q.split("=")[1];
			String path = null;
			Map<String, String> env = System.getenv();
			if ((path = env.get("PATH_TO_INDICES")) != null) {
				PATH_TO_INDICES = path;
			}
			index = new Index(PATH_TO_INDICES + username + INDEX_EXT);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@OnWebSocketMessage
	public void onMessage(Session session, String message) {
		System.out.println("Message: " + message);
		String[] m = null;
		try {
			try {
				session.getRemote().sendString("Server got your message: " + message);
			} catch (Exception e) {
				e.printStackTrace();
			}
			m = parseMessage(message);
			String query = "";
			if (m.length > 3) {
				int w = 0;
				for (w = 2; w < m.length; w++) {
					query = query + m[w];
				}
			} else if (m.length > 2) {
				query = m[2];
			} else {
				throw new Exception("Malformed request");
			}
			System.out.println("Query = " + query);

			if (username == null) {
				username = m[0];
			}
			String command = m[1];
			// String query = m[2]; //See fix above
			String to_send = null;
			if (command.equalsIgnoreCase(CMD_UPDATE)) {
				// Create an index from the message
				System.out.println("Received index update");
				if (index.update(query)) {
					to_send = "Update successful";
				} else {
					to_send = "Update failed";
				}
				System.out.println(to_send);
			} else if (command.equalsIgnoreCase(CMD_SEARCH)) {
				// Search through the index that was created above
				System.out.println("Receieved search query");
				if (!index.isEmpty()) {
					to_send = index.search(query).toString();
				} else {
					System.err.println("Index is empty");
				}
			} else if (command.equalsIgnoreCase(CMD_CONNECT)) {
				username = m[0];
			}
			try {
				// Send the search result to the client
				if (to_send != null) {
					System.out.println("sendString: " + to_send);
					session.getRemote().sendString(to_send);
				} else {
					System.out.println("Result is null");
				}
			} catch (IOException e) {
				System.err.println("Could not send result to client.");
				e.printStackTrace();
			}
		} catch (Exception e) {
			System.err.println("Malformed query request: " + m + "\nfrom "
					+ session.getRemoteAddress().getAddress());
		}
	}

	/**
	 * In case our message get more complex
	 * 
	 * TODO: Consider creating a Message object that holds the
	 * username, command, and query
	 * @param mes
	 * @return [0] username, [1] command, [2] query
	 */
	public String[] parseMessage(String mes) {
		String[] arr = mes.split(DELIMITER);
		return arr;
	}
}
