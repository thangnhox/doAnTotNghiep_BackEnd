CREATE TABLE test_DoAnTotNghiep.Publisher (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.Category (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.Membership (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) UNIQUE NOT NULL,
    Rank INT NOT NULL,
    AllowNew BIT(8) NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.User (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    Name VARCHAR(255) UNIQUE NOT NULL,
    BirthYear INT NOT NULL,
    Avatar VARCHAR(255),
    INDEX (email)
);

CREATE TABLE test_DoAnTotNghiep.Discount (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Expire_date DATE NOT NULL,
    Status BIT(8) NOT NULL
);

CREATE TABLE test_DoAnTotNghiep.Books (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    cover_url VARCHAR(255),
    status BIT(8) NOT NULL,
    PublisherID INT NOT NULL,
    IsRecommended INT DEFAULT 0,
    INDEX (Title),
    FOREIGN KEY (PublisherID) REFERENCES test_DoAnTotNghiep.Publisher(ID)
);

CREATE TABLE test_DoAnTotNghiep.BookMembership (
    MembershipID INT,
    BooksID INT,
    PRIMARY KEY (MembershipID, BooksID),
    FOREIGN KEY (MembershipID) REFERENCES test_DoAnTotNghiep.Membership(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID)
);

CREATE TABLE test_DoAnTotNghiep.Orders (
    UserID INT,
    BooksID INT,
    DiscountID INT,
    Date DATE NOT NULL,
    PRIMARY KEY (UserID, BooksID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID),
    FOREIGN KEY (DiscountID) REFERENCES test_DoAnTotNghiep.Discount(ID)
);

CREATE TABLE test_DoAnTotNghiep.Used (
    DiscountID INT,
    UserID INT,
    PRIMARY KEY (DiscountID, UserID),
    FOREIGN KEY (DiscountID) REFERENCES test_DoAnTotNghiep.Discount(ID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID)
);

CREATE TABLE test_DoAnTotNghiep.Subcribe (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    MembershipID INT NOT NULL,
    DiscountID INT,
    Date DATE NOT NULL,
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (MembershipID) REFERENCES test_DoAnTotNghiep.Membership(ID),
    FOREIGN KEY (DiscountID) REFERENCES test_DoAnTotNghiep.Discount(ID)
);

CREATE TABLE test_DoAnTotNghiep.MembershipRecord (
    UserID INT,
    MembershipID INT,
    Expire_date DATE NOT NULL,
    PRIMARY KEY (UserID, MembershipID),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (MembershipID) REFERENCES test_DoAnTotNghiep.Membership(ID)
);

CREATE TABLE test_DoAnTotNghiep.Notes (
    UserID INT,
    BooksID INT,
    Page INT,
    Detail TEXT NULL,
    PRIMARY KEY (UserID, BooksID, Page),
    FOREIGN KEY (UserID) REFERENCES test_DoAnTotNghiep.User(ID),
    FOREIGN KEY (BooksID) REFERENCES test_DoAnTotNghiep.Books(ID)
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

DELIMITER $$

CREATE TRIGGER after_subscribe_insert
AFTER INSERT ON test_DoAnTotNghiep.Subcribe
FOR EACH ROW
BEGIN
    DECLARE expire_date DATE;

    -- Check if the corresponding record exists
    SELECT Expire_date INTO expire_date
    FROM test_DoAnTotNghiep.MembershipRecord
    WHERE UserID = NEW.UserID AND MembershipID = NEW.MembershipID;

    IF expire_date IS NOT NULL THEN
        -- If exists, extend Expire_date for 30 days
        UPDATE test_DoAnTotNghiep.MembershipRecord
        SET Expire_date = DATE_ADD(expire_date, INTERVAL 30 DAY)
        WHERE UserID = NEW.UserID AND MembershipID = NEW.MembershipID;
    ELSE
        -- If not exists, insert new record
        INSERT INTO test_DoAnTotNghiep.MembershipRecord (UserID, MembershipID, Expire_date)
        VALUES (NEW.UserID, NEW.MembershipID, DATE_ADD(CURDATE(), INTERVAL 30 DAY));
    END IF;
END$$

DELIMITER ;

