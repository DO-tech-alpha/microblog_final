import Iter "mo:base/Iter";
import List "mo:base/List";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

actor {
    public type Time = Time.Time;

    public type Message = {
        content: Text;
        author: Text;
        time: Time;
    };

    public type MessageExt = {
        content: Text;
        author: Text;
        time: Time;
        author_canister_id: Text;
    };

    public type Microblog = actor {
        set_name: shared (Text) -> async ();
        get_name: shared query () -> async ?Text;
        follow: shared (Principal) -> async ();
        follows: shared query () -> async [Principal];
        post: shared (Text) -> async ();
        posts: shared query (Time) -> async [Message];
        timeline: shared (Time) -> async [MessageExt];
    };

    stable var name : ?Text = null;

    public shared func set_name(new_name: Text) : async () {
        name := ?new_name;
    };

    public shared func get_name() : async ?Text {
        name
    };

    stable var followed : List.List<Principal> = List.nil();

    public shared func follow(id: Principal) : async () {
        followed := List.push(id, followed);
    };

    public shared query func follows() : async [Principal] {
        List.toArray(followed)
    };

    stable var messages : List.List<Message> = List.nil();

    public shared (msg) func post(text: Text) : async () {
        var author: Text = switch name {
            case (?n) n;
            case null "anonymous";
        };
        messages := List.push({ content = text; author = author; time = Time.now(); }, messages);
    };

    public shared query func posts(since: Time) : async [Message] {
        List.toArray(List.filter(messages, func (message: Message): Bool {
            message.time > since
        }))
    };

    public shared func timeline(since: Time) : async [MessageExt] {
        var all : List.List<MessageExt> = List.nil();
        for (id in Iter.fromList(followed)) {
            let canister_id : Text = Principal.toText(id);
            let canister : Microblog = actor(canister_id);
            let msgs = await canister.posts(since);
            for (msg in Iter.fromArray(msgs)) {
                all := List.push({ content = msg.content; author = msg.author; time = msg.time; author_canister_id = canister_id; }, all);
            }
        };
        List.toArray(all)
    };
};
