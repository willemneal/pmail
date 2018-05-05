package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	bolt "github.com/coreos/bbolt"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

//User
type User struct {
	Email     string `json:",email"`
	Publickey string `json:",publickey"`
}

var publicKeysBucket = []byte("PublicKeys")
var searchBucket = []byte("EncryptedSearch")

var db *bolt.DB

//GetPublicKey with the param email
func GetPublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		v := b.Get(email)
		user := User{Email: r.FormValue("email"), Publickey: string(v[:])}
		json.NewEncoder(w).Encode(user)
		return nil
	})

}

//AddPublicKey adds a the public key with email as the key
func AddPublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	publicKey := []byte(r.FormValue("publicKey"))
	db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		err := b.Put(email, publicKey)
		user := User{Email: r.FormValue("email"), Publickey: r.FormValue("publicKey")}
		if err == nil {
			json.NewEncoder(w).Encode(user)
		}
		return nil
	})
}

//RemovePublicKey removes public key with email as the key
func RemovePublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		err := b.Delete(email)
		user := User{Email: string(email[:]), Publickey: "DELETED"}
		if err == nil {
			json.NewEncoder(w).Encode(user)
		}
		return nil
	})

}

//PutSearchIndex with the param email
func PutSearchIndex(w http.ResponseWriter, r *http.Request) {
	var encrypted_index []string
	_ = json.Unmarshal([]byte(r.FormValue("encrypted_index")), &encrypted_index)

	var email_list []string

	db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(searchBucket)
		for _, elem := range encrypted_index {
			var curr_email_list []string
			v := b.Get([]byte(elem))
			_ = json.Unmarshal([]byte(v), &curr_email_list)
			fmt.Println(curr_email_list)
			email_list = append(email_list, curr_email_list...)
		}
		json.NewEncoder(w).Encode(email_list)
		return nil
	})

}

//AddSearchIndex adds a the public key with email as the key
func AddSearchIndex(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email_id"))
	var encrypted_index []string
	_ = json.Unmarshal([]byte(r.FormValue("encrypted_index")), &encrypted_index)
	
	db.Batch(func(tx *bolt.Tx) error {
		b := tx.Bucket(searchBucket)
		fmt.Println(encrypted_index)
		for _, elem := range encrypted_index {
			fmt.Println(elem)
			v := b.Get([]byte(elem))
			if v == nil {
				var new_enc_index []string
				new_enc_index = append(new_enc_index, string(email))
				fmt.Println(new_enc_index)
				out, _ := json.Marshal(new_enc_index)
				_ = b.Put([]byte(elem), []byte(out))
			} else {
				var curr_enc_index []string
				_ = json.Unmarshal([]byte(v), &curr_enc_index)
				curr_enc_index = append(curr_enc_index, string(email))
				res_enc_index := removeDuplicatesUnordered(curr_enc_index)
				out, _ := json.Marshal(res_enc_index)
				_ = b.Put([]byte(elem), []byte(out) )
			}

		}
		json.NewEncoder(w).Encode(string(email))
		return nil
	})
}

func removeDuplicatesUnordered(elements []string) []string {
    encountered := map[string]bool{}

    // Create a map of all unique elements.
    for v:= range elements {
        encountered[elements[v]] = true
    }

    // Place all keys from the map into a slice.
    result := []string{}
    for key, _ := range encountered {
        result = append(result, key)
    }
    return result
}

// main function to boot up everything
func main() {
	allowedHeaders := handlers.AllowedHeaders([]string{"X-Requested-With"})
	allowedOrigins := handlers.AllowedOrigins([]string{"*"})
	allowedMethods := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"})

	router := mux.NewRouter()

	dbO, err := bolt.Open("pmail.db", 0600, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer dbO.Close()

	db = dbO
	db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(publicKeysBucket)
		if err != nil {
			return fmt.Errorf("Error creating publicKey Bucket %s", err)
		}
		return nil
	})

	db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(searchBucket)
		if err != nil {
			return fmt.Errorf("Error creating Search Bucket %s", err)
		}
		return nil
	})

	router.HandleFunc("/publickey", GetPublicKey).Methods("GET").Queries("email", "{email}")
	router.HandleFunc("/publickey", AddPublicKey).Methods("POST")
	router.HandleFunc("/publickey", RemovePublicKey).Methods("DELETE")
	router.HandleFunc("/search", PutSearchIndex).Methods("PUT")
	router.HandleFunc("/search", AddSearchIndex).Methods("POST")

	log.Fatal(http.ListenAndServe(":8000", handlers.CORS(allowedHeaders, allowedOrigins, allowedMethods)(router)))
}
