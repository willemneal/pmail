package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	bolt "github.com/coreos/bbolt"
	"github.com/gorilla/mux"
)

//User
type User struct {
	Email     string `json:",email"`
	Publickey string `json:",publickey"`
}

var publicKeysBucket = []byte("PublicKeys")
var db *bolt.DB

//GetPublicKey with the param email
func GetPublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		v := b.Get(email)
		user := User{Email: string(email[:]), Publickey: string(v[:])}
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
		user := User{Email: string(email[:]), Publickey: string(publicKey[:])}
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

// main function to boot up everything
func main() {
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

	router.HandleFunc("/publickey", GetPublicKey).Methods("GET").Queries("email", "{email}")
	router.HandleFunc("/publickey", AddPublicKey).Methods("POST")
	router.HandleFunc("/publickey", RemovePublicKey).Methods("DELETE")
	log.Fatal(http.ListenAndServe(":8000", router))
}
