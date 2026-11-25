---
title: From Local Networks to the Internet
date: 2026-11-07
tags: []
---

Networking is one of those subjects where it is relatively easy to use a technology without understanding how it actually works.

As a software developer, I regularly interact with IP addresses, ports, Docker networks, remote servers and development environments. However, knowing how to use these things is different from understanding the problems they solve.

I wanted to understand networking from the ground up, starting with the most fundamental concepts and progressively building a mental model of how everything fits together.

This article is a compilation of that learning process, including the questions I had along the way and the explanations that helped me understand them.

## Table of contents

1. [Networking fundamentals](#networking-fundamentals)
2. [How computers communicate](#how-computers-communicate)
3. [Network infrastructure](#network-infrastructure)
4. [Internet connectivity](#internet-connectivity)
5. [Putting everything together](#putting-everything-together)
6. [Practical networking cheat sheet](#practical-networking-cheat-sheet)

---

<h1 id="networking-fundamentals">1. Networking fundamentals</h1>

## **1.1 What exactly is a network?**

A network is a collection of interconnected devices capable of exchanging information.

Consider a typical home network consisting of a laptop, a desktop computer, a smartphone and a router. Together, these devices can form a Local Area Network, commonly referred to as a LAN.

One important distinction is that a LAN is not the same thing as Wi-Fi.

- **LAN:** A local network of interconnected devices.
- **Wi-Fi:** A wireless technology for accessing a local network.
- **Ethernet:** A wired technology for accessing a local network.
- **Internet:** A global network of interconnected networks.

Wi-Fi is a means of accessing a local network, not the network itself.

If the internet provider experiences an outage, the laptop can still communicate with the desktop computer, provided that the local network remains operational.

Local networking does not require internet connectivity.

## **1.2 What is an IP address?**

An IP address is a logical address assigned to a network interface that allows packets to be delivered to it.

Imagine the following home network:

| Device     | IP address   |
| ---------- | ------------ |
| Router     | 192.168.1.1  |
| Laptop     | 192.168.1.10 |
| Desktop    | 192.168.1.20 |
| Smartphone | 192.168.1.30 |

If the laptop wants to communicate with the desktop, it can use 192.168.1.20 as its destination IP address.

An IPv4 address consists of 32 bits, divided into four groups of eight bits, known as octets. Each octet is represented by a decimal number between 0 and 255.

For example, 192.168.1.20 is represented in binary as:

`11000000.10101000.00000001.00010100`

### Does an IP address identify a device permanently?

No. An IP address is not a permanent hardware identifier.

A computer can have multiple network interfaces, each with its own IP addresses. A laptop, for example, can have a Wi-Fi interface, an Ethernet interface, a loopback interface and a virtual VPN interface.

Its IP addresses can also change over time.

## **1.3 Private versus public IP addresses**

One of the first questions I had was how different computers could have exactly the same IP address.

A computer in my house could have the address 192.168.1.20, while another person's computer, in a completely different house, could have precisely the same address.

This is possible because certain IP address ranges are reserved for private networks.

| Private range                 | CIDR |
| ----------------------------- | ---- |
| 10.0.0.0 – 10.255.255.255     | /8   |
| 172.16.0.0 – 172.31.255.255   | /12  |
| 192.168.0.0 – 192.168.255.255 | /16  |

These addresses are not globally routed over the public internet. Independent private networks can therefore reuse them.

Public IP addresses, on the other hand, are intended to be globally routable.

This raises an interesting question: if a computer has a private IP address, how can it communicate with a public server on the internet?

The answer involves NAT, which I will explore later in this article.

## **1.4 What is a port?**

An IP address identifies a network destination, but a computer can run multiple applications simultaneously.

Imagine a computer running the following services:

| Service                    | Port |
| -------------------------- | ---: |
| SSH                        |   22 |
| HTTP server                |   80 |
| Angular development server | 4200 |
| PostgreSQL                 | 5432 |

All these services can use the same IP address while listening on different ports.

If I want to access the Angular application, I might open:

`http://192.168.1.20:4200`

If I want to establish an SSH connection, I might execute:

`ssh user@192.168.1.20`

SSH uses TCP port 22 by default.

A port is not a physical component. It is a logical number interpreted by the operating system's networking stack.

TCP and UDP each have their own port number space, ranging from 0 to 65535.

When information arrives, the operating system uses the protocol, IP addresses, ports and connection information to determine which socket should receive it.

An application listening on a port is not necessarily accessible from the internet. That depends on other mechanisms, including routing, firewalls and NAT.

## **1.5 What is a subnet mask?**

Knowing a computer's IP address is not enough to determine which other addresses belong to its local network.

This is where subnet masks come into play.

Consider the following configuration:

- IP address: 192.168.1.20
- Subnet mask: 255.255.255.0
- CIDR notation: 192.168.1.20/24

The /24 means that the first 24 bits identify the network, leaving eight bits for addresses within that network.

In this particular case, 192.168.1 identifies the network, while the final octet distinguishes addresses within it.

| Address                     | Purpose                     |
| --------------------------- | --------------------------- |
| 192.168.1.0                 | Network address             |
| 192.168.1.1                 | Common router address       |
| 192.168.1.2 – 192.168.1.254 | Other usable host addresses |
| 192.168.1.255               | Broadcast address           |

The router does not have to use the first usable address. This is merely a common convention.

### Why does a computer need a subnet mask?

Imagine a computer with the address 192.168.1.10/24.

It wants to communicate with four different destinations.

| Destination   | Same subnet? |
| ------------- | ------------ |
| 192.168.1.20  | Yes          |
| 192.168.1.200 | Yes          |
| 192.168.2.20  | No           |
| 8.8.8.8       | No           |

For destinations within its directly connected subnet, the computer can attempt local delivery.

For destinations outside that subnet, it consults its routing table to determine where the packet should go next.

This is fundamentally why subnet configuration matters.

### Understanding CIDR notation

The larger the CIDR prefix, the smaller the subnet.

| CIDR | Subnet mask     | Total addresses | Conventional usable hosts |
| ---- | --------------- | --------------: | ------------------------: |
| /16  | 255.255.0.0     |          65,536 |                    65,534 |
| /24  | 255.255.255.0   |             256 |                       254 |
| /25  | 255.255.255.128 |             128 |                       126 |
| /26  | 255.255.255.192 |              64 |                        62 |
| /28  | 255.255.255.240 |              16 |                        14 |

The total number of addresses is calculated as 2 raised to the number of remaining host bits.

A /24 leaves eight host bits, resulting in 256 addresses. In a conventional subnet, two are reserved for the network and broadcast addresses. Special subnet configurations have exceptions.

## **1.6 Understanding localhost and 0.0.0.0**

As a software developer, these are two addresses I encounter regularly.

### 127.0.0.1

The address 127.0.0.1 is an IPv4 loopback address, commonly associated with localhost.

It allows a computer to communicate with itself without sending traffic through the physical network.

If I start an Angular development server and access:

`http://127.0.0.1:4200`

The communication remains within my computer.

Every computer has its own loopback interface. Localhost on one computer is therefore completely independent of localhost on another.

### 0.0.0.0

When an application binds to 0.0.0.0, it listens on all available local IPv4 interfaces.

For example:

`ng serve --host 0.0.0.0`

This potentially allows another computer on the local network to access the Angular development server.

| Listening address | Accessibility             |
| ----------------- | ------------------------- |
| 127.0.0.1:4200    | Local computer only       |
| 192.168.1.20:4200 | Specific local IP address |
| 0.0.0.0:4200      | All local IPv4 interfaces |

Binding to 0.0.0.0 does not automatically expose an application to the public internet. It simply determines which local IPv4 addresses the application listens on.

The address also appears in routing tables as 0.0.0.0/0, where it has a different operational meaning that I will explore later.

---

<h1 id="how-computers-communicate">2. How computers communicate</h1>

Now that I understand how computers and applications are addressed, the next question is how they actually exchange information.

What happens when I send a message, download a file or access a website? What happens if some of that information is lost? Is everything transmitted over the internet encrypted?

## **2.1 What is a packet?**

When computers exchange information, they do not necessarily transmit it as one continuous block of data.

Networking protocols divide and encapsulate information into smaller units. At the IP layer, these units are called packets.

An IP packet consists of two fundamental parts:

- **Header:** Information required to process and deliver the packet.
- **Payload:** The information being transported.

An IPv4 packet header contains information such as the source IP address, destination IP address, transport protocol and Time to Live (TTL).

For example, a packet transporting information from a laptop to a desktop computer might contain:

| Field          | Value        |
| -------------- | ------------ |
| Source IP      | 192.168.1.10 |
| Destination IP | 192.168.1.20 |
| Protocol       | TCP          |
| Payload        | TCP segment  |

The packet does not necessarily contain an entire message or file. It may contain only a small portion of the information being exchanged.

## **2.2 Understanding networking layers**

One of the most useful mental models for understanding networking is to divide communication into layers.

Each layer is responsible for solving a different problem.

| Layer       | Examples        | Responsibility                       |
| ----------- | --------------- | ------------------------------------ |
| Application | HTTP, SSH, DNS  | Define what information is exchanged |
| Transport   | TCP, UDP        | Exchange data between applications   |
| Internet    | IP              | Deliver packets across networks      |
| Link        | Ethernet, Wi-Fi | Deliver data across a local link     |

Imagine that a browser wants to send an HTTP request using TCP.

The HTTP request itself does not need to understand how to deliver packets across multiple networks. It delegates that responsibility to the layers underneath it.

Conceptually, the information is assembled as follows:

1. The application creates HTTP data.
2. TCP adds transport information, including ports and sequence numbers.
3. IP adds source and destination addressing information.
4. Ethernet or Wi-Fi provides local link-layer delivery.

This process is called **encapsulation**.

Each layer wraps the information provided by the layer above it with additional protocol-specific information.

The receiving computer reverses this process, eventually delivering the application data to the appropriate application.

Each layer solves its own problem without needing to understand every detail of the layers above it.

## **2.3 Does IP guarantee delivery?**

No.

IP provides a best-effort mechanism for delivering packets between network destinations.

It does not inherently guarantee that packets:

- Reach their destination.
- Arrive in the correct order.
- Arrive only once.
- Arrive within a particular time.

This is where transport protocols become particularly important.

## **2.4 TCP — Transmission Control Protocol**

TCP provides a reliable, ordered stream of bytes between applications.

Before exchanging application data, a normal TCP connection begins with a three-way handshake:

1. The client sends a SYN message.
2. The server responds with SYN-ACK.
3. The client responds with ACK.

This establishes connection state and synchronizes sequence numbers.

Once the connection is established, TCP uses several mechanisms to manage communication:

- **Sequence numbers:** Track transmitted bytes.
- **Acknowledgements:** Indicate which data has been received.
- **Retransmissions:** Recover missing information.
- **Flow control:** Prevent overwhelming the receiving computer.
- **Congestion control:** Regulate transmission according to network conditions.

TCP is commonly used for SSH, database connections, file transfers, HTTP/1.1 and HTTP/2.

### What happens if a TCP packet is lost?

Imagine that a sender transmits three consecutive portions of data.

| Data   | Result   |
| ------ | -------- |
| Data 1 | Received |
| Data 2 | Lost     |
| Data 3 | Received |

The receiver cannot simply present the application with Data 1 followed by Data 3 as though nothing happened.

TCP tracks the sequence of bytes and attempts to recover the missing information through retransmission.

Data 3 may remain buffered until the missing bytes arrive.

Eventually, assuming the connection remains operational, the application receives the complete ordered stream.

The important distinction is that TCP does not guarantee that a network failure can always be recovered from. Rather, it provides reliable delivery mechanisms and reports failures when communication cannot continue.

## **2.5 UDP — User Datagram Protocol**

UDP provides a much simpler mechanism for transporting information.

Unlike TCP, UDP does not establish a connection through a built-in handshake.

It does not inherently provide acknowledgements, retransmissions or ordered delivery.

Imagine the same scenario:

| Data       | Result   |
| ---------- | -------- |
| Datagram 1 | Received |
| Datagram 2 | Lost     |
| Datagram 3 | Received |

UDP does not automatically recover Datagram 2.

The application receives the available datagrams and must decide what to do about missing information.

UDP gives applications greater control over how they handle timing, reliability and delivery.

### Why would anyone choose UDP over TCP?

Initially, TCP seemed like the obviously superior protocol. Why would I deliberately choose something that does not guarantee reliable delivery?

The answer depends on the nature of the information being transmitted.

**Downloading a file**

Imagine downloading a 100 MB file.

If a portion of that file is missing, the downloaded file may be corrupted.

I would generally prefer the connection to take slightly longer rather than receive incomplete information.

Reliability is more important than immediate delivery.

**A live voice conversation**

Imagine having a live conversation over the internet.

If a small portion of audio is lost, retransmitting it a second later may no longer be useful.

The conversation has already moved forward.

Maintaining a responsive conversation can be more valuable than recovering every missing piece of information.

**An online multiplayer game**

Imagine a game sending continuous updates about a player's position.

If one position update is lost but a newer update arrives shortly afterwards, the previous update may no longer be relevant.

Retransmitting outdated information could introduce unnecessary delays.

However, not all information in a game is disposable. Certain events may require reliable delivery, which applications can implement themselves.

This is why UDP is useful: it gives the application control over which information requires reliability.

## **2.6 TCP versus UDP**

| Characteristic                | TCP         | UDP       |
| ----------------------------- | ----------- | --------- |
| Built-in connection handshake | Yes         | No        |
| Reliable delivery mechanism   | Yes         | No        |
| Ordered delivery              | Yes         | No        |
| Automatic retransmission      | Yes         | No        |
| Communication model           | Byte stream | Datagrams |
| Built-in congestion control   | Yes         | No        |
| Protocol overhead             | Higher      | Lower     |
| Encryption by default         | No          | No        |

UDP is not inherently faster in every situation, and TCP is not inherently better.

They solve different problems.

Modern protocols such as QUIC demonstrate that reliable, encrypted communication can also be implemented on top of UDP. HTTP/3 uses QUIC rather than TCP.

## **2.7 Are IP packets encrypted?**

This was another important question during my learning process.

I initially wondered whether information travelling through the internet was encrypted by default.

It is not.

IP packets are not inherently encrypted. TCP and UDP do not inherently encrypt application data either.

If I send an ordinary HTTP request containing credentials, someone capable of inspecting the traffic may be able to read those credentials.

For example, an unencrypted HTTP request could contain:

`POST /login`

`username=example&password=example123`

HTTPS addresses this problem using TLS.

Instead of transmitting readable HTTP application data, HTTPS encrypts that information before it is transported across the network.

### How can routers forward encrypted packets?

If information is encrypted, how does a router know where to send it?

The answer lies in the distinction between the application data and the networking information surrounding it.

In a typical HTTPS connection, the IP header remains visible while the HTTP application data is encrypted.

The router can inspect the destination IP address and forward the packet without understanding the encrypted content.

Encryption and routing solve fundamentally different problems.

- Encryption protects information from unauthorized access.
- Routing determines where information should be delivered.

A router does not need to understand what an application is saying to deliver its packets.

### What information remains visible with HTTPS?

HTTPS provides substantial protection, but it does not automatically make all network activity invisible.

| Information            | HTTP     | HTTPS     |
| ---------------------- | -------- | --------- |
| Source IP address      | Visible  | Visible   |
| Destination IP address | Visible  | Visible   |
| Transport ports        | Visible  | Visible   |
| Traffic timing         | Visible  | Visible   |
| Traffic volume         | Visible  | Visible   |
| HTTP request path      | Readable | Encrypted |
| Request body           | Readable | Encrypted |
| Response content       | Readable | Encrypted |

Depending on DNS and TLS configuration, an intermediary may also be able to determine which hostname is being accessed.

HTTPS protects the communication content, but it does not necessarily conceal the fact that communication is taking place.

---

<h1 id="network-infrastructure">3. Network infrastructure</h1>

Understanding how packets are structured and exchanged does not explain how they reach their destinations.

How does a computer know where to send a packet? Who assigns its IP address when it connects to Wi-Fi? Why do different computers sometimes use different DNS servers even when connected to the same network?

## **3.1 What exactly is a router?**

A router is a device responsible for forwarding packets between different networks.

In a typical home network, it connects two different networks:

- The LAN, representing the private home network.
- The WAN, through which the internet provider provides connectivity.

However, the physical device we call a router usually performs several different responsibilities.

| Component             | Responsibility                   |
| --------------------- | -------------------------------- |
| Router                | Forward packets between networks |
| Network switch        | Connect local Ethernet devices   |
| Wireless access point | Provide Wi-Fi connectivity       |
| DHCP server           | Automatically configure devices  |
| DNS forwarder         | Forward DNS queries              |
| Firewall              | Control permitted traffic        |
| NAT                   | Translate network addresses      |

These are fundamentally different mechanisms that happen to be bundled into the same physical device.

A router does not inherently need to provide Wi-Fi, DHCP or DNS.

### Does all communication pass through the router?

Imagine that a laptop wants to communicate with a desktop computer.

Both computers belong to the same local network.

- Laptop: 192.168.1.10/24
- Desktop: 192.168.1.20/24

Because both devices are within the same directly connected subnet, the laptop can attempt to deliver the information locally.

The traffic may physically travel through the home router's integrated switch or wireless access point, but it does not require IP routing between different networks.

This is different from accessing an external internet server.

In that case, the computer needs to send the packet to another device capable of forwarding it towards a different network.

## **3.2 MAC addresses and ARP**

IP addresses identify logical network destinations, but local Ethernet and Wi-Fi communication also uses link-layer addresses, commonly referred to as MAC addresses.

Imagine that a laptop knows the desktop computer's IP address but does not know its MAC address.

How does it deliver a local frame to the correct interface?

For IPv4, it commonly uses ARP — Address Resolution Protocol.

Conceptually, the process works as follows:

1. The laptop broadcasts a message asking which device owns 192.168.1.20.
2. The desktop computer responds with its MAC address.
3. The laptop constructs a frame addressed to the appropriate local network interface.

The result is usually cached temporarily so that the computer does not need to repeat this process for every packet.

For remote destinations, the computer instead resolves the MAC address of its next-hop router.

This highlights an important distinction: IP addresses identify network destinations, whereas MAC addresses are used for delivery across the local link.

## **3.3 What is a gateway?**

A gateway is a device through which traffic can reach another network.

In a typical home network, the default gateway is the router.

A laptop might have the following configuration:

| Configuration   | Value         |
| --------------- | ------------- |
| IP address      | 192.168.1.10  |
| Subnet mask     | 255.255.255.0 |
| Default gateway | 192.168.1.1   |

If the laptop wants to communicate with 8.8.8.8, it determines that this address is outside its directly connected subnet.

It can then send the packet towards its default gateway.

### Does the destination IP become the gateway's IP?

No. This is an important distinction.

If a computer sends a packet to 8.8.8.8, the destination IP remains 8.8.8.8 when the packet leaves that computer.

The gateway is the next hop, not the final destination.

The local frame is addressed to the router's MAC address, while the IP packet inside that frame contains the final destination IP.

| Information           | Value                |
| --------------------- | -------------------- |
| Source IP             | 192.168.1.10         |
| Destination IP        | 8.8.8.8              |
| Next hop              | 192.168.1.1          |
| Local destination MAC | Router's MAC address |

The router receives the frame, processes the IP packet and makes its own decision about where to forward it next.

Each router along the path performs a similar forwarding operation.

Unless a mechanism such as NAT modifies the addresses, the IP source and destination generally remain unchanged while the link-layer addressing changes between hops.

## **3.4 What is a routing table?**

Every IP-capable computer maintains routing information.

A routing table is essentially a collection of instructions that tells the operating system how to reach different network destinations.

A simplified routing table might look like this:

| Destination    | Next hop        | Interface |
| -------------- | --------------- | --------- |
| 127.0.0.0/8    | Local           | Loopback  |
| 192.168.1.0/24 | Direct delivery | Wi-Fi     |
| 0.0.0.0/0      | 192.168.1.1     | Wi-Fi     |

When the operating system needs to send a packet, it selects the most specific matching route.

This is known as **longest prefix matching**.

If a computer wants to communicate with 192.168.1.20, the route for 192.168.1.0/24 matches.

If it wants to communicate with 8.8.8.8, neither the loopback route nor the local subnet route matches. The computer therefore uses the default route.

### What does 0.0.0.0/0 mean?

This notation represents the entire IPv4 address space.

The /0 prefix means that no address bits need to match.

Consequently, every IPv4 address matches this route.

Because the operating system prefers more specific routes, the default route is used when there is no better match.

This is different from binding an application to 0.0.0.0.

| Context                      | Meaning                            |
| ---------------------------- | ---------------------------------- |
| Application binding: 0.0.0.0 | Listen on all local IPv4 addresses |
| Routing table: 0.0.0.0/0     | Match all IPv4 destinations        |

## **3.5 What is DHCP?**

When I connect a new computer to a Wi-Fi network, I generally do not need to configure its IP address, subnet mask, gateway or DNS server manually.

Some mechanism must be providing that information.

That mechanism is DHCP — Dynamic Host Configuration Protocol.

In a typical home network, the DHCP server runs on the router.

The initial DHCPv4 address assignment process is commonly described using four steps, abbreviated as DORA.

| Step        | Description                                    |
| ----------- | ---------------------------------------------- |
| Discover    | The client searches for available DHCP servers |
| Offer       | A server proposes an IP configuration          |
| Request     | The client requests the proposed configuration |
| Acknowledge | The server confirms the assignment             |

The DHCP server can provide configuration such as:

| Configuration   | Example       |
| --------------- | ------------- |
| IP address      | 192.168.1.20  |
| Subnet mask     | 255.255.255.0 |
| Default gateway | 192.168.1.1   |
| DNS server      | 192.168.1.1   |
| Lease duration  | 24 hours      |

The client now has the information required for typical local and internet communication.

### Does my IP address change when the DHCP lease expires?

This was one of the questions I specifically wanted to understand.

A DHCP lease defines a period during which a client is authorized to use an assigned IP address.

However, the client normally attempts to renew the lease before it expires.

If the renewal succeeds, the client may continue using the exact same IP address.

Therefore, an IP address does not necessarily change every time the lease is renewed.

If the computer remains disconnected for an extended period, the DHCP server may eventually assign its previous address to another device.

### How can I make sure a home server keeps the same IP address?

This is particularly relevant when self-hosting applications that need to remain accessible from other devices.

There are two common approaches.

**Static IP address:** Manually configure the address, subnet mask, gateway and other network settings on the computer.

**DHCP reservation:** Configure the DHCP server to consistently assign a specific address to the device.

A DHCP reservation allows the server to retain automatic network configuration while keeping a predictable local address.

For a home server, this is often a convenient solution.

## **3.6 What is DNS?**

Computers use IP addresses to deliver packets, but humans prefer memorable names.

DNS — Domain Name System — provides a distributed mechanism for resolving names into network information.

Instead of remembering a server's IP address, I can use a domain name such as example.com.

A DNS resolver can look up the corresponding address and return it to the computer.

The browser can then establish a connection to that address.

### How does DNS resolution actually work?

Assuming the requested information is not already cached, a recursive DNS resolver may need to communicate with several different servers.

Conceptually:

1. The computer asks its configured DNS resolver for example.com.
2. The resolver consults a root DNS server.
3. The root server provides information about the relevant top-level domain servers.
4. The resolver consults the .com servers.
5. Those servers provide information about the domain's authoritative DNS servers.
6. The resolver obtains the requested DNS record.
7. The result is returned to the computer and may be cached.

In practice, caching frequently eliminates several of these steps.

DNS also supports different types of records.

| Record | Purpose                                       |
| ------ | --------------------------------------------- |
| A      | IPv4 address                                  |
| AAAA   | IPv6 address                                  |
| CNAME  | Alias to another domain name                  |
| MX     | Mail server information                       |
| TXT    | Text information, often used for verification |
| NS     | Authoritative name server information         |

DNS is more than just a simple domain-to-IP mapping.

### Why do different computers use different DNS servers?

While investigating my own network, I noticed that one computer was configured to use the router's local IP address as its DNS server, while another was using 1.1.1.1.

At first, this seemed like a fundamental difference in how the computers connected to the internet.

In reality, both are valid DNS configurations.

**Computer A — DNS server: 192.168.1.1**

The computer sends its DNS query to the router.

The router typically acts as a DNS forwarder, forwarding the request to an upstream resolver or responding with cached information.

**Computer B — DNS server: 1.1.1.1**

The computer addresses its DNS query directly to Cloudflare's public DNS resolver.

The packet still travels through the default gateway because 1.1.1.1 is outside the local subnet.

The important difference is which device receives and handles the DNS query, not whether the packet physically travels through the router.

### Does using Cloudflare DNS mean all my traffic goes through Cloudflare?

No.

DNS resolution and application communication are separate network exchanges.

Cloudflare may resolve the domain name for me, but my subsequent connection normally goes towards the address returned by DNS.

Changing my DNS resolver does not automatically change my default gateway, establish a VPN or proxy all my internet traffic.

Some common public DNS resolvers are:

| Address | Provider   |
| ------- | ---------- |
| 1.1.1.1 | Cloudflare |
| 1.0.0.1 | Cloudflare |
| 8.8.8.8 | Google     |
| 8.8.4.4 | Google     |
| 9.9.9.9 | Quad9      |

The addresses 1.1.1.1 and 8.8.8.8 are ordinary publicly routable IP addresses associated with DNS services. They are not special networking instructions.

---

<h1 id="internet-connectivity">4. Internet connectivity</h1>

At this point, I understand how computers are addressed, how they exchange information, how they obtain their network configuration and how they determine where to send packets.

However, there is still a fundamental problem.

A computer has a private IP address that cannot be globally routed over the public internet. How can it communicate with a server somewhere else in the world?

And if it can initiate that communication, why can't an external computer necessarily initiate a connection back to it?

## **4.1 Does a router have two IP addresses?**

Typically, a home router has at least two network-facing IP addresses.

One belongs to the local network, while another belongs to the network through which the internet provider provides connectivity.

| Interface  | IP address  |
| ---------- | ----------- |
| Router LAN | 192.168.1.1 |
| Router WAN | 203.0.113.5 |

The first address is used for communication within the home network.

The second is used for communication through the WAN interface.

For the following examples, I will use 203.0.113.5 as an illustrative public IP address and 192.0.2.10 as an illustrative remote server address. Both belong to ranges reserved for documentation.

The WAN address is not necessarily a public IP address, because internet providers may implement additional layers of NAT.

## **4.2 What is NAT?**

NAT stands for Network Address Translation.

It allows a network device to translate IP addresses as packets move between networks.

A typical home router uses a form of NAT called Port Address Translation, also known as PAT or NAPT.

This allows multiple private computers to share a single external IPv4 address by translating both IP addresses and, when necessary, transport ports.

Imagine that a laptop wants to establish an HTTPS connection with a remote server.

Before the packet reaches the router, it contains the following information:

| Field            | Before NAT   |
| ---------------- | ------------ |
| Source IP        | 192.168.1.10 |
| Source port      | 51000        |
| Destination IP   | 192.0.2.10   |
| Destination port | 443          |

The router translates the source address and, in this example, the source port.

| Field            | After NAT   |
| ---------------- | ----------- |
| Source IP        | 203.0.113.5 |
| Source port      | 62001       |
| Destination IP   | 192.0.2.10  |
| Destination port | 443         |

From the remote server's perspective, the connection appears to originate from 203.0.113.5:62001.

The server does not need to know the laptop's original private IP address to respond.

When the server sends a response, the router reverses the translation and forwards the information to the laptop.

### How does the router know which computer should receive the response?

This was one of the most important questions I had about NAT.

If all the computers in a house share the same public IP address, how does the router differentiate between their connections?

The router maintains translation state.

Imagine that a laptop, desktop computer and smartphone establish connections to the same remote server simultaneously.

Coincidentally, all three devices use the same private source port.

The router might create the following translations:

| Device     | Private endpoint   | External endpoint |
| ---------- | ------------------ | ----------------- |
| Laptop     | 192.168.1.10:51000 | 203.0.113.5:62001 |
| Desktop    | 192.168.1.20:51000 | 203.0.113.5:62002 |
| Smartphone | 192.168.1.30:51000 | 203.0.113.5:62003 |

When a response arrives at external port 62002, the router can determine that it belongs to the desktop computer's connection.

Actual NAT state may also incorporate the transport protocol and remote endpoint information.

This is fundamentally how dozens of devices can communicate through the same public IPv4 address without their responses becoming mixed up.

## **4.3 Understanding inbound and outbound connections**

An outbound connection is initiated from within a network towards an external destination.

An inbound connection is initiated from outside a network towards a destination inside it.

This distinction is particularly important when reasoning about network security.

Imagine that a laptop connects to a web server.

The server's response travels towards the home network. This is incoming traffic, but it is associated with communication that the laptop initiated.

Now imagine that an unknown computer on the internet attempts to connect to the desktop computer.

This is a completely new connection initiated externally.

In the absence of an applicable NAT mapping or forwarding rule, the router generally does not know which internal device should receive this unsolicited traffic.

A firewall may independently reject it as well.

The important distinction is that **incoming packets and incoming connection initiation are not the same thing.**

Blocking unsolicited inbound connections does not necessarily prevent a computer from receiving responses to connections it initiates.

## **4.4 What is port forwarding?**

Imagine that I am hosting a web application on a desktop computer.

It is available locally at:

`http://192.168.1.20:3000`

A laptop can access it because both devices belong to the same private network, assuming their configurations permit the connection.

However, a computer on the public internet cannot normally route packets directly to 192.168.1.20.

Port forwarding allows me to configure the router to translate incoming traffic on a particular external port into traffic destined for a particular internal service.

| Configuration | Value        |
| ------------- | ------------ |
| External IP   | 203.0.113.5  |
| External port | 8080         |
| Internal IP   | 192.168.1.20 |
| Internal port | 3000         |

An external computer connects to 203.0.113.5:8080.

The router applies the forwarding rule and translates the destination to 192.168.1.20:3000.

The desktop computer receives the connection, assuming the application is listening on an accessible interface and the necessary firewalls permit it.

This requires a reachable external address.

Port forwarding does not make a service secure. It creates a path through which external computers can potentially reach it.

Authentication, encryption, application security and firewall configuration remain separate responsibilities.

## **4.5 What is CGNAT?**

IPv4 has a limited address space.

Because there are not enough public IPv4 addresses for every internet-connected device, internet providers sometimes share a public address between multiple customers.

This mechanism is called Carrier-Grade NAT, or CGNAT.

Imagine two houses connected to the same internet provider.

Each house has its own private network and its own home router.

However, instead of receiving a public IPv4 address, the routers receive addresses from a shared address range, commonly 100.64.0.0/10.

The internet provider then performs another NAT translation before traffic reaches the public internet.

There are now two layers of NAT:

1. The home router translates the computer's private address into its WAN address.
2. The internet provider translates that WAN address into a shared public address.

For example:

| Network boundary   | Source IP    |
| ------------------ | ------------ |
| Computer           | 192.168.1.10 |
| Home router WAN    | 100.64.1.10  |
| ISP public address | 203.0.113.5  |

This introduces a problem for inbound connectivity.

Even if I configure port forwarding on my own router, traffic must first reach that router through the internet provider's NAT layer.

Without a corresponding mechanism at the ISP level, port forwarding on my home router alone may not be sufficient.

This is one of the reasons why establishing direct connections between computers on different private networks can become complicated.

## **4.6 What is a firewall?**

A firewall controls which network traffic is permitted or denied according to a collection of rules.

Rules can take into consideration information such as:

- Source IP address.
- Destination IP address.
- Transport protocol.
- Source and destination ports.
- Connection state.
- Application or process identity, depending on the firewall.

For example, a server might have the following policy:

| Traffic                                  | Decision |
| ---------------------------------------- | -------- |
| SSH from the local network               | Allow    |
| HTTPS from any network                   | Allow    |
| External PostgreSQL connections          | Deny     |
| Return traffic for permitted connections | Allow    |
| Other unsolicited inbound traffic        | Deny     |

A firewall can exist at several points throughout a network.

The router may have its own firewall. The laptop may have an operating system firewall. The desktop computer may have another firewall.

Traffic may need to satisfy multiple independent security policies before reaching the intended application.

### If I enable a computer's firewall, can it still access the internet?

This question was particularly relevant when I was thinking about the security of remote access.

I wanted one computer to be able to initiate connections to another while preventing the second computer from initiating connections back to the first.

This is possible because a stateful firewall can distinguish between different connection states.

Imagine that a laptop establishes an SSH connection to a desktop computer.

The desktop computer needs to send responses back to the laptop for that connection to function.

A stateful firewall can permit those responses without allowing the desktop to establish an entirely separate SSH connection in the opposite direction.

There are three distinct cases:

| Communication                              | Example policy |
| ------------------------------------------ | -------------- |
| Laptop initiates connection to desktop     | Allow          |
| Desktop responds to established connection | Allow          |
| Desktop initiates new connection to laptop | Deny           |

This does not mean that the permitted outbound connection is inherently risk-free. An external service can still send application data back through it.

Nevertheless, controlling connection initiation is an important security boundary.

The exact behaviour depends on the operating system and firewall configuration. Some firewalls primarily focus on inbound application connections, while others support more general network-level filtering.

### Is NAT a firewall?

No.

NAT and firewalls are frequently implemented together, which makes it easy to confuse their responsibilities.

| Mechanism  | Responsibility                                |
| ---------- | --------------------------------------------- |
| Routing    | Determines where packets should go            |
| NAT        | Translates addresses and potentially ports    |
| Firewall   | Determines whether traffic is permitted       |
| Encryption | Protects information from unauthorized access |

A NAT router often prevents unsolicited inbound traffic because there is no applicable translation mapping.

However, this is not the same thing as enforcing a security policy.

A firewall is responsible for controlling permitted communication.

This distinction becomes particularly important with IPv6, where globally routable addresses can be assigned directly to devices without requiring the same kind of address translation.

Devices can still be protected against unwanted inbound connections through firewall policies.

## **4.7 What can my gateway actually see?**

Since internet-bound traffic normally passes through my gateway, I wanted to understand how much visibility that device has into my activities.

In a typical HTTPS connection, the router can potentially observe:

- The source IP address.
- The destination IP address.
- Transport protocol and ports.
- The amount of data being transferred.
- The timing and frequency of packets.
- Unencrypted DNS queries, if they pass through it.

However, it cannot normally read the encrypted HTTP request or response contents without access to the relevant cryptographic keys or some form of trusted TLS interception.

The requested hostname may also be visible depending on DNS and TLS configuration.

This explains why using HTTPS does not necessarily hide which services I communicate with, even though it protects the contents of those communications.

The key realization is that a router does not need to understand application data to forward it successfully.

---

<h1 id="putting-everything-together">5. Putting everything together</h1>

Now that I understand these mechanisms individually, I can finally describe what happens when I open a website.

Imagine that I enter:

`https://example.com`

Assuming a typical IPv4 connection using TCP and HTTPS, with no cached DNS result or reusable connection, the process looks like this.

## Step 1 — Network configuration

The computer has previously obtained its network configuration through DHCP.

It knows its IP address, subnet mask, default gateway and DNS server.

## Step 2 — DNS resolution

The browser or operating system resolves example.com into a destination IP address using a DNS resolver.

DNS provides the information required to identify the remote destination.

## Step 3 — Routing decision

The operating system consults its routing table and determines that the destination is outside the local subnet.

It selects the default gateway as the next hop.

## Step 4 — Local address resolution

If necessary, the computer uses ARP to discover the router's MAC address.

It can now construct a local frame that will reach the router.

The frame targets the router's MAC address, while the IP packet targets the remote server's IP address.

## Step 5 — TCP connection establishment

The computer starts a TCP handshake with the remote server on port 443.

It sends a SYN message and waits for the server's response.

## Step 6 — NAT and firewall processing

As the connection's packets pass through the router, applicable firewall rules are evaluated and the private source address is translated.

The router maintains the necessary translation state.

The remote server sees the translated external IP address rather than the original private IP address.

## Step 7 — Internet routing

The packets travel through the internet provider's network and other interconnected networks towards the destination server.

Each router makes a forwarding decision based on its routing information.

Return packets allow the TCP handshake to complete.

## Step 8 — TLS connection establishment

The browser validates the server's identity and establishes encrypted communication through TLS.

The application data can now be exchanged securely.

## Step 9 — HTTP request

The browser sends the HTTP request through the encrypted connection.

The networking infrastructure forwards the packets without needing to decrypt the HTTP content.

## Step 10 — Response delivery

The server responds.

Return packets reach the home router, which reverses the NAT translation and forwards them to the appropriate computer.

TCP processes the incoming data and attempts to recover any missing information.

## Step 11 — Application processing

The operating system and browser process the received information, decrypt the application data and render the website.

All these mechanisms participate in what appears to be a single, simple action.

---

<h1 id="practical-networking-cheat-sheet">6. Practical networking cheat sheet</h1>

Understanding these concepts becomes significantly easier when I can inspect them on a real computer.

## **6.1 Useful commands**

| Objective                   | macOS                         | Linux                      |
| --------------------------- | ----------------------------- | -------------------------- |
| Inspect network interfaces  | `ifconfig`                    | `ip addr`                  |
| Inspect routing table       | `netstat -rn`                 | `ip route`                 |
| Find default gateway        | `route -n get default`        | `ip route show default`    |
| Inspect DNS configuration   | `scutil --dns`                | `resolvectl status`        |
| Inspect ARP/neighbour cache | `arp -a`                      | `ip neigh`                 |
| Inspect listening TCP ports | `lsof -nP -iTCP -sTCP:LISTEN` | `ss -lntp`                 |
| Resolve a domain            | `dig example.com`             | `dig example.com`          |
| Test reachability           | `ping 192.168.1.1`            | `ping 192.168.1.1`         |
| Trace a network path        | `traceroute example.com`      | `traceroute example.com`   |
| Test a TCP port             | `nc -vz 192.168.1.20 3000`    | `nc -vz 192.168.1.20 3000` |

Some commands may require additional packages or depend on the networking services installed on the operating system.

### Inspecting a specific routing decision

On Linux:

`ip route get 8.8.8.8`

On macOS:

`route -n get 8.8.8.8`

These commands help identify which interface and gateway the operating system selects for a particular destination.

### Using a specific DNS resolver

`dig @1.1.1.1 example.com`

This allows me to query a specific DNS resolver rather than using the system's default configuration.

### Inspecting packets

On Linux:

`sudo tcpdump -i any -nn 'tcp port 443'`

On macOS, assuming en0 is the relevant interface:

`sudo tcpdump -i en0 -nn 'tcp port 443'`

These commands allow me to observe TCP traffic associated with HTTPS connections without revealing the decrypted application content.

### Testing reachability with ping

`ping 192.168.1.1`

Ping normally uses ICMP rather than TCP or UDP.

Not every IP packet needs to contain a TCP segment or UDP datagram.

A failed ping does not necessarily mean a device is unreachable, since ICMP traffic may be filtered. Similarly, a successful ping does not guarantee that a particular TCP or UDP service is accessible.

## **6.2 A practical approach to debugging connectivity**

Imagine that I cannot access an application hosted on another computer.

Rather than randomly changing configurations, I can investigate each layer independently.

| Question                                    | Investigation                     |
| ------------------------------------------- | --------------------------------- |
| Is the computer connected to the network?   | Inspect network interfaces        |
| Am I using the correct IP address?          | Inspect assigned IP addresses     |
| Is there a valid route?                     | Inspect the routing table         |
| Can I reach the destination?                | Test with ping or other tools     |
| Is the application running?                 | Inspect listening sockets         |
| Is it listening on an accessible interface? | Check the listening IP and port   |
| Is the connection permitted?                | Inspect firewall rules            |
| Is external forwarding required?            | Inspect NAT and port forwarding   |
| Is the application responding correctly?    | Use curl or an appropriate client |

For example, if a web server is running on port 3000, I can test it locally:

`curl -v http://127.0.0.1:3000`

Then, from another computer:

`curl -v http://192.168.1.20:3000`

If the first command succeeds but the second fails, the problem may be related to the listening interface, routing, local network connectivity or firewall configuration rather than the application itself.

Understanding networking allows me to narrow down which mechanism is failing instead of treating connectivity as a single black box.

## **6.3 Common IP addresses**

| Address         | Meaning                                           |
| --------------- | ------------------------------------------------- |
| 127.0.0.1       | Localhost / IPv4 loopback                         |
| 0.0.0.0         | Unspecified IPv4 address; wildcard server binding |
| 0.0.0.0/0       | All IPv4 destinations; default route              |
| 192.168.1.1     | Common home router address                        |
| 192.168.0.0/16  | Private IPv4 range                                |
| 10.0.0.0/8      | Private IPv4 range                                |
| 172.16.0.0/12   | Private IPv4 range                                |
| 100.64.0.0/10   | Shared address space commonly used for CGNAT      |
| 8.8.8.8         | Google public DNS resolver                        |
| 1.1.1.1         | Cloudflare public DNS resolver                    |
| 255.255.255.255 | Limited IPv4 broadcast address                    |
| ::1             | IPv6 loopback address                             |
| ::              | Unspecified IPv6 address                          |

---

# Final mental model

If I forget everything else, these are the fundamental responsibilities I should remember.

| Concept            | The problem it solves                                    |
| ------------------ | -------------------------------------------------------- |
| LAN                | Connecting devices locally                               |
| Wi-Fi and Ethernet | Transmitting information across local links              |
| MAC address        | Identifying a local link-layer interface                 |
| IP address         | Identifying a network destination                        |
| Port               | Identifying a transport-layer endpoint                   |
| Subnet mask        | Defining the network portion of an address               |
| Packet             | Carrying information across IP networks                  |
| TCP                | Providing reliable, ordered communication                |
| UDP                | Providing lightweight datagram communication             |
| ARP                | Resolving local IPv4 addresses into link-layer addresses |
| Router             | Forwarding packets between networks                      |
| Gateway            | Providing a next hop towards another network             |
| Routing table      | Determining where packets should go                      |
| DHCP               | Automatically configuring network devices                |
| DNS                | Resolving names into network information                 |
| NAT                | Translating network addresses                            |
| CGNAT              | Sharing public IPv4 addresses between ISP customers      |
| Port forwarding    | Directing external traffic to internal services          |
| Firewall           | Controlling permitted network communication              |
| TLS                | Protecting and authenticating communication              |

The most important realization from this learning process is that networking is not one enormous technology responsible for everything.

It is a collection of relatively independent mechanisms, each responsible for solving a specific problem.

Once I understand those problems individually, I can understand how the mechanisms interact.

This provides the foundation necessary to understand more advanced technologies such as VPNs, WireGuard, Tailscale, reverse proxies and Cloudflare Tunnel without treating them as black boxes.

And that was ultimately the entire purpose of learning networking from the ground up.
