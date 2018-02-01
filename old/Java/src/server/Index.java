package server;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class Index {
	private String user = null;
	private HashMap<Long, String> index = null;

	// ----- Constructors ----- \\
	public Index() {
		this.index = new HashMap<Long, String>();
	}

	public Index(HashMap<Long, String> index_in, String user) {
		this.index = index_in;
		this.user = user;
	}

	/**
	 * Attempt to read a saved index from "filepath"
	 * If the read fails, create an empty index
	 * 
	 * @param filepath
	 */
	public Index(String filepath) {
		System.out.println("Loading index from " + filepath);
		HashMap<Long, String> tmp = readIndexFromFile(filepath);
		this.index = (tmp != null) ? tmp : new HashMap<Long, String>();
	}

	// ----- Helper Methods ----- \\
	/**
	 * Replace with real encryption function
	 * @param to_hash
	 * @return
	 */
	private int hash(Object to_hash) {
		return to_hash.hashCode();
	}

	private static String decrypt_id(String token, int count, String id_hashed) {
		Long l = Long.parseUnsignedLong(id_hashed, 16);
		Long hash = (long) (token + count + "value").hashCode();
		return String.valueOf(l ^ hash);
	}

	// ----- Main Functionality ----- \\
	/**
	 * Search the index for the token
	 * @param token
	 * @return all e-mail IDs with matching token
	 */
	public ArrayList<String> search(String token) {
		System.out.println("Searching for: " + token);
		ArrayList<String> ret_list = new ArrayList<String>();
		String id_hashed = null;
		long key_hashed = 0;
		int count = 0;
		String key_str = null;
		do {
			key_str = token + count + "key";
			key_hashed = Long.parseUnsignedLong(safeHash(key_str), 16);
			id_hashed = index.get(key_hashed);
			if (id_hashed != null) {
				// ret_list.add(decrypt_id(token, count, id_hashed));
				ret_list.add(id_hashed);
			}
			count++;
		} while (id_hashed != null);
		if (ret_list.isEmpty()) {
			System.out.println("No ids found");
		}
		return ret_list;
	}

	/**
	 * "Waterfall insert"
	 * If a collision occurs, insert "token" and move the existing key to the next
	 * position
	 * @param token
	 * @param id
	 * @return
	 */
	public boolean push(Long token, String id_hashed) {
		Long key_hashed = 0L;
		String key_str = null, temp = null;
		int count = 0;
		// String id_hashed = String.valueOf(hash(id));
		// String id_hashed = safeHash(id + count + "value");
		do {
			key_str = Long.toUnsignedString(token, 16) + count + "key";
			key_hashed = Long.parseUnsignedLong(safeHash(key_str), 16);
			// Insert the token if no collision
			temp = index.get(key_hashed);
			if (temp != null && temp.equalsIgnoreCase(id_hashed)) {
				System.out.println("Duplicate entry: "
						+ Long.toUnsignedString(token, 16) + "-->" + id_hashed);
				System.out.println("Skipping element.");
				return false;
			}
			index.put(key_hashed, id_hashed);
			id_hashed = temp;
			count++;
		} while (temp != null); // Could be a while-true loop
		return true;
	}

	public boolean put(String token, String id) {
		Long key_hashed = 0L;
		int count = 0;
		String id_hashed = String.valueOf(hash(id));
		do {
			key_hashed = (long) hash(token + count + "key");
			// Insert the token if no collision
			if (!index.containsKey(new Long(key_hashed))) {
				index.put(key_hashed, id_hashed);
				break;
			}
			count++;
		} while (!index.containsKey(key_hashed)); // Could be a while-true loop
		return true;
	}

	public boolean put(Long key_hashed, String id) {
		int count = 0;
		String id_hashed = id;// String.valueOf(hash(id));
		do {
			// Insert the token if no collision
			if (!index.containsKey(new Long(key_hashed))) {
				index.put(key_hashed, id_hashed);
				break;
			}
			count++;
		} while (!index.containsKey(key_hashed)); // Could be a while-true loop
		return true;
	}

	/**
	 * Not sure how to send the update. User does not know the count when
	 * creating the hashed_key
	 * 
	 * Solution:
	 * 1) user sends only the token keyword to the server and the
	 * server determine the proper count
	 * 2) user sends the entire hashed_key and
	 * when the server updates, it checks for collision and
	 * 2a) creates a linked-list for that key
	 * 2b) increments the count until there is no collision
	 * 
	 * @param update
	 * @param curr_index
	 * @return
	 */
	public boolean update(HashMap<String, String> update) {
		try {
			for (String token : update.keySet()) {
				this.put(token, update.get(token));
			}
		} catch (Exception e) {
			System.err.println("Update failed. " + e);
			return false;
		}
		return true;
	}

	/**
	 * Update the index from a JSON object (in particular, a JavaScript map).
	 * This method will parse the string into a JSON object.
	 * 
	 * @param json_map
	 * @return true on success, false on failure
	 */
	public boolean update(String json_map) {
		JSONParser p = new JSONParser();
		try {
			Object parsed = p.parse(json_map);
			JSONObject json_array = (JSONObject) parsed;
			Iterator<?> it = json_array.entrySet().iterator();
			String pair[] = null;
			while (it.hasNext()) {
				pair = it.next().toString().split("=");
				// this.index.put(Integer.parseInt(pair[0]), Integer.parseInt(pair[1]));
				// might have to be "Long.parseUnsignedLong()" which requires Java 1.8
				// this.index.put(Integer.parseInt(pair[0]),
				// Long.parseUnsignedLong(pair[1]));
				this.push(Long.parseUnsignedLong(pair[0], 16), pair[1]);
			}
		} catch (ParseException e1) {
			System.err.println("Could not parse index.");
			e1.printStackTrace();
			return false;
		} catch (ClassCastException e) {
			System.err.println("Update is not in map format.");
			e.printStackTrace();
			return false;
		} catch (NumberFormatException e) {
			System.err.println("Could not parse the long");
			e.printStackTrace();
			return false;
		}

		return true;
	}

	/**
	 * Serialize the encrypted index to file
	 * @param filepath
	 * @param index
	 * @return true on success, false on failure
	 */
	public boolean save(String filepath) {
		System.out.println("Saving index to " + filepath);
		File file = new File(filepath);
		try (FileOutputStream fos = new FileOutputStream(file);
				ObjectOutputStream oos = new ObjectOutputStream(fos);) {
			oos.writeObject(index); // serialize the HashMap to a file
			oos.close();
			fos.close();
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
		System.err.println("Save successfull");
		return true;
	}

	public boolean isEmpty() {
		return index.isEmpty();
	}

	/**
	 * Hash using cryptographically safe SHA-256
	 * @param str
	 * @return String of the byte array
	 */
	public static String safeHash(String str) {
		MessageDigest md = null;
		byte[] hash;
		StringBuilder sb = new StringBuilder();
		try {
			md = MessageDigest.getInstance("sha-256");
		} catch (NoSuchAlgorithmException e) {
			System.err.println("Invalid MessageDigest");
			e.printStackTrace();
			return null;
		}
		hash = md.digest(str.getBytes());
		// Convert from byte[] to String
		for (int i = 0; i < hash.length; i++) {
			sb.append(String.format("%02x", hash[i]));
		}
		return sb.toString().substring(0, 16);
	}

	@Override
	public String toString() {
		String str = "{";
		for (Long key : index.keySet()) {
			str += Long.toUnsignedString(key, 16);
			str += "=";
			str += index.get(key);
			str += ", ";
		}
		return str += "}";
	}

	/**
	 * Read the index stored at the filepath. Must be a Java HashMap<Long,
	 * String>
	 * @param filepath
	 * @return
	 */
	public static HashMap<Long, String> readIndexFromFile(String filepath) {
		HashMap<Long, String> ret_index = null;
		try (FileInputStream in = new FileInputStream(filepath);
				ObjectInputStream ois = new ObjectInputStream(in);) {
			ret_index = (HashMap<Long, String>) ois.readObject();
			ois.close();
			in.close();
		} catch (FileNotFoundException e) {
			System.err.println("No index found at " + filepath);
			System.err.println("Creating a new index");
			return null;
		} catch (IOException | ClassNotFoundException e) {
			e.printStackTrace();
			return null;
		} catch (ClassCastException e) {
			System.err.println(filepath + " is not a Java HashMap<Long, String>.");
			e.printStackTrace();
			return null;
		}
		System.out.println("Load successful.");
		return ret_index;
	}
}
