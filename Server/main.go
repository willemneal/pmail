package main

import (
	"fmt"
	"log"
	"net/http"

	bolt "github.com/coreos/bbolt"
	"github.com/gorilla/mux"
)

var publicKeysBucket = []byte("PublicKeys")
var db *bolt.DB

func GetPublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		v := b.Get(email)
		fmt.Printf("The answer is: %s\n", v)
		return nil
	})
}

func AddPublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	publicKey := []byte(r.FormValue("publicKey"))
	db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		err := b.Put(email, publicKey)
		return err
	})
}

func RemovePublicKey(w http.ResponseWriter, r *http.Request) {
	email := []byte(r.FormValue("email"))
	db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(publicKeysBucket)
		err := b.Delete(email)
		return err
	})

}

// main function to boot up everything
func main() {
	router := mux.NewRouter()

	db, err := bolt.Open("pmail.db", 0600, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

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
