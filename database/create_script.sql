CREATE TABLE test_DoAnTotNghiep.Publisher (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.Category (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.Membership (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Rank INT NOT NULL,
    AllowNew BIT(8) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.User (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    BirthYear INT NULL,
    Avatar VARCHAR(255),
    Status INT NOT NULL DEFAULT 1,
    isAdmin BOOLEAN NOT NULL DEFAULT 0,
    INDEX (email)
);

CREATE TABLE test_DoAnTotNghiep.Discount (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Ratio FLOAT NOT NULL,
    Expire_date DATE NOT NULL,
    Status BIT(8) NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.Authors (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Avatar VARCHAR(255) NULL,
    Name VARCHAR(255) NOT NULL,
    BirthDate DATE,
    Nationality VARCHAR(100),
    Description TEXT NOT NULL,
    UNIQUE (Name, BirthDate),
    CHECK (CHAR_LENGTH(Description) >= 25)
);

CREATE TABLE test_DoAnTotNghiep.Books (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NOT NULL,
    PageCount INT NOT NULL,
    Rank INT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    cover_url VARCHAR(255),
    status BIT(8) NOT NULL,
    AuthorsID INT NOT NULL,
    PublisherID INT NOT NULL,
    PublishDate DATE NOT NULL,
    IsRecommended INT DEFAULT 0,
    INDEX (Title),
    FOREIGN KEY (PublisherID) REFERENCES test_DoAnTotNghiep.Publisher(ID),
    FOREIGN KEY (AuthorsID) REFERENCES test_DoAnTotNghiep.Authors(ID),
    CHECK (CHAR_LENGTH(Description) >= 20)
);

CREATE TABLE test_DoAnTotNghiep.Notes (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    BooksID INT NOT NULL,
    Page INT NOT NULL DEFAULT -1,
    Detail TEXT NULL,
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID),
    UNIQUE (UserID, BooksID, Page)
);

CREATE TABLE test_DoAnTotNghiep.Tags (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    UNIQUE (UserID, Name)
);

CREATE TABLE test_DoAnTotNghiep.TagsBooks (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    TagsID INT NOT NULL,
    BooksID INT NOT NULL,
    Page INT NOT NULL DEFAULT -1,
    FOREIGN KEY (TagsID) REFERENCES test_DoAnTotNghiep.Tags(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID),
    UNIQUE (TagsID, BooksID, Page)
);

CREATE TABLE test_DoAnTotNghiep.TagsNotes(
    ID INT PRIMARY KEY AUTO_INCREMENT,
    TagsID INT NOT NULL,
    NotesID INT NOT NULL,
    FOREIGN KEY (TagsID) REFERENCES test_DoAnTotNghiep.Tags(ID),
    FOREIGN KEY (NotesID) REFERENCES test_DoAnTotNghiep.Notes(ID),
    UNIQUE (TagsID, NotesID)
);

CREATE TABLE test_DoAnTotNghiep.Bill (
	ID VARCHAR(64) PRIMARY KEY,
	UserID INT NOT NULL,
	DiscountID INT NULL,
    TransID BIGINT NULL,
	TotalPrice DECIMAL(10, 2) NOT NULL,
	CreateDate DATE NOT NULL,
	PaymentDate DATE NULL,
	FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
	FOREIGN KEY (DiscountID) REFERENCES test_DoAnTotNghiep.Discount(ID)
);

CREATE TABLE test_DoAnTotNghiep.Orders (
    UserID INT,
    BooksID INT,
	BillID VARCHAR(64),
    PRIMARY KEY (UserID, BooksID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID),
	FOREIGN KEY (BillID) REFERENCES test_DoAnTotNghiep.Bill(ID)
);

CREATE TABLE test_DoAnTotNghiep.Used (
    DiscountID INT,
    UserID INT,
    PRIMARY KEY (DiscountID, UserID),
    FOREIGN KEY (DiscountID) REFERENCES test_DoAnTotNghiep.Discount(ID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID)
);

CREATE TABLE test_DoAnTotNghiep.Subscribe (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    MembershipID INT NOT NULL,
    DiscountID INT,
    TransID BIGINT,
    TotalPrice DECIMAL(10,2) NOT NULL,
    Date DATE NOT NULL,
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (MembershipID) REFERENCES test_DoAnTotNghiep.Membership(ID),
    FOREIGN KEY (DiscountID) REFERENCES test_DoAnTotNghiep.Discount(ID)
);

CREATE TABLE test_DoAnTotNghiep.MembershipRecord (
    UserID INT,
    MembershipID INT,
    Token TEXT NULL,
    PartnerClientId VARCHAR(50) NULL,
    Expire_date DATE NOT NULL,
    PRIMARY KEY (UserID, MembershipID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (MembershipID) REFERENCES test_DoAnTotNghiep.Membership(ID)
);

CREATE TABLE test_DoAnTotNghiep.BookCategory (
    CategoryID INT,
    BooksID INT,
    PRIMARY KEY (CategoryID, BooksID),
    FOREIGN KEY (CategoryID) REFERENCES test_DoAnTotNghiep.Category(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID)
);

CREATE TABLE test_DoAnTotNghiep.Likes (
    UserID INT,
    BooksID INT,
    PRIMARY KEY (UserID, BooksID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID)
);

CREATE TABLE test_DoAnTotNghiep.BookRequest (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    INDEX (Title)
);

CREATE TABLE test_DoAnTotNghiep.ReadHistory (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BooksID INT NOT NULL,
    LastRead INT NOT NULL,
    Progress INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID),
    UNIQUE (UserID, BooksID)
);


CREATE VIEW test_DoAnTotNghiep.BookDetails AS
SELECT 
    b.ID AS BookID,
    b.Title,
    b.Description,
    b.PageCount,
    b.Price,
    b.Rank,
    b.cover_url,
    b.status,
    b.PublishDate,
    b.IsRecommended,
    p.Name AS PublisherName,
    a.Name AS AuthorName,
    GROUP_CONCAT(c.Name) AS Categories,
    COALESCE(l.likes, 0) AS LikesCount
FROM 
    test_DoAnTotNghiep.Books b
JOIN 
    test_DoAnTotNghiep.Publisher p ON b.PublisherID = p.ID
JOIN 
    test_DoAnTotNghiep.Authors a ON b.AuthorsID = a.ID
LEFT JOIN 
    test_DoAnTotNghiep.BookCategory bc ON b.ID = bc.BooksID
LEFT JOIN 
    test_DoAnTotNghiep.Category c ON bc.CategoryID = c.ID
LEFT JOIN 
    ( SELECT BooksID, COUNT(*) as likes from Likes GROUP BY BooksID ) l ON b.ID = l.BooksID
GROUP BY 
    b.ID;



INSERT INTO test_DoAnTotNghiep.User (Email, password, Name, BirthYear, isAdmin)
VALUES ('admin@example.com', 'securepassword', 'Admin User', 1980, 1);

