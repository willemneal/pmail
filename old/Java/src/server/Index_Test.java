package server;

import org.junit.Test;

public class Index_Test {
	String keywords1[] = { "daven", "says", "hi" };
	String email_id1 = "1532b3b5b735c65e";
	String json_index1 = "{\"0256ab21f2f63135\":\"c941bbcd210341c7\",\"6e9f7ee1a9f1243e\":\"d78a8867e0935693\",\"6c5934fde666189e\":\"800efbb30b397713\"}";
	String keywords2[] = { "test", "body", "one", "two", "four" };
	String email_id2 = "1516091939ba7b42";
	String json_index2 = "{\"534349289\":\"-1519411928712952519\",\"1521034986\":"
			+ "\"1519411929077930110\",\"-73152642\":\"-1519411928943651438\","
			+ "\"-1561113987\":\"-1519411929236777651\",\"-99919049\":"
			+ "\"-1519411928932285685\"}";
	String water_keywords[] = { "secret", "message" };
	String water_index = "{\"2bb80d537b1da3e3\":\"1532b5bbaea252bb\",\"ab530a13e4591498\":\"1532b5bbaea252bb\"}";
	Index index = new Index();
	{
		index.update(water_index);
		// index.update(json_index1);
		// index.update(json_index2);
	}

	@Test
	public void testSearch() {
		index.update(water_index);
		for (String keyword : water_keywords) {
			System.out.println("Searching for: " + keyword);
			String token = Index.safeHash(keyword);
			System.out.println(index.search(token.toString()));
		}
	}

	@Test
	public void testSave() {
		index.save("/tmp/test_index.jso");
	}

	@Test
	public void testReadIndexFromFile() {
		Index in = new Index("/tmp/test_index.jso");
		System.out.println("Printing read index");
		System.out.println(in.toString());
	}

	@Test
	public void testPush() {
		Index in = new Index();
		// in.push("asdf", "123");
		// in.push("asdf", "124");
		System.out.println(in.toString());
	}
}
