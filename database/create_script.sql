CREATE DATABASE IF NOT EXISTS test_DoAnTotNghiep;
USE test_DoAnTotNghiep;

CREATE TABLE Category (
    ID VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

CREATE TABLE Books (
    ID VARCHAR(255) PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Price FLOAT NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    cover_url VARCHAR(255),
    status BIT(8) NOT NULL,
    INDEX (Title)
);

CREATE TABLE Publisher (
    ID VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

CREATE TABLE Publishing (
    BooksID VARCHAR(255) NOT NULL,
    PublisherID VARCHAR(255) NOT NULL,
    Date DATE NOT NULL,
    PRIMARY KEY (BooksID, PublisherID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID),
    FOREIGN KEY (PublisherID) REFERENCES Publisher(ID)
);

CREATE TABLE Discount (
    ID VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Expire_date DATE NOT NULL,
    Status BIT(8) NOT NULL
);

CREATE TABLE Book_Discount (
    BooksID VARCHAR(255) NOT NULL,
    DiscountID VARCHAR(255) NOT NULL,
    PRIMARY KEY (BooksID, DiscountID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID),
    FOREIGN KEY (DiscountID) REFERENCES Discount(ID)
);

CREATE TABLE Membership (
    ID VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Rank INT NOT NULL,
    AllowNew BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE Membership_Discount (
    MembershipID VARCHAR(255) NOT NULL,
    DiscountID VARCHAR(255) NOT NULL,
    PRIMARY KEY (MembershipID, DiscountID),
    FOREIGN KEY (MembershipID) REFERENCES Membership(ID),
    FOREIGN KEY (DiscountID) REFERENCES Discount(ID)
);

CREATE TABLE Book_Membership (
    MembershipID VARCHAR(255) NOT NULL,
    BooksID VARCHAR(255) NOT NULL,
    PRIMARY KEY (MembershipID, BooksID),
    FOREIGN KEY (MembershipID) REFERENCES Membership(ID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID)
);

CREATE TABLE test_DoAnTotNghiep.User (
    ID VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    BirthYear INT NOT NULL,
    Avatar VARCHAR(255) NOT NULL,
    UNIQUE INDEX (email)
);

CREATE TABLE User_Membership (
    MembershipID VARCHAR(255) NOT NULL,
    UserID VARCHAR(255) NOT NULL,
    Expire_date DATE NOT NULL,
    PRIMARY KEY (MembershipID, UserID),
    FOREIGN KEY (MembershipID) REFERENCES Membership(ID),
    FOREIGN KEY (UserID) REFERENCES User(ID)
);

CREATE TABLE Orders (
    UserID VARCHAR(255) NOT NULL,
    BooksID VARCHAR(255) NOT NULL,
    Date DATE NOT NULL,
    PRIMARY KEY (UserID, BooksID),
    FOREIGN KEY (UserID) REFERENCES User(ID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID)
);

CREATE TABLE Likes (
    UserID VARCHAR(255) NOT NULL,
    BooksID VARCHAR(255) NOT NULL,
    PRIMARY KEY (UserID, BooksID),
    FOREIGN KEY (UserID) REFERENCES User(ID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID)
);

CREATE TABLE Notes (
    UserID VARCHAR(255) NOT NULL,
    BooksID VARCHAR(255) NOT NULL,
    Page INT NOT NULL,
    Detail TEXT,
    PRIMARY KEY (UserID, BooksID, Page),
    INDEX (Detail),
    FOREIGN KEY (UserID) REFERENCES User(ID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID)
);

CREATE TABLE Book_Category (
    CategoryID VARCHAR(255) NOT NULL,
    BooksID VARCHAR(255) NOT NULL,
    PRIMARY KEY (CategoryID, BooksID),
    FOREIGN KEY (CategoryID) REFERENCES Category(ID),
    FOREIGN KEY (BooksID) REFERENCES Books(ID)
);
