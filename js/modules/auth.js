// js/modules/auth.js
export class AuthManager {
    constructor(firebase) {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
    }

    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Create user profile
            await this.db.collection('users').doc(userCredential.user.uid).set({
                email: userCredential.user.email,
                name: userCredential.user.email.split('@')[0],
                role: 'user',
                dateCreated: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.currentUser = userCredential.user;
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        await this.auth.signOut();
        this.currentUser = null;
    }

    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            callback(user);
        });
    }
}
