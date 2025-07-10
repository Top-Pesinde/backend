chmod +x quick_test.sh && ./quick_test.sh#!/bin/bash

# Hızlı Kaleci Teklif Test Scripti - 10 Kullanıcı

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://176.96.131.222:3000/api/v1"
GOALKEEPER_LISTING_ID="cmcxffgo30000dzm9k13leto3"

echo -e "${BLUE}⚡ HIZLI TEKLİF TEST SCRİPTİ (10 KULLANICI)${NC}"
echo -e "${YELLOW}📋 Kaleci İlan ID: $GOALKEEPER_LISTING_ID${NC}"
echo ""

# Zaman damgası kullanarak benzersiz kullanıcı isimleri
TIMESTAMP=$(date +%s)

# Fonksiyon: Kullanıcı kaydı
register_user() {
    local username=$1
    local email=$2
    local password=$3
    local phone=$4
    
    echo -e "${YELLOW}📝 Kayıt: $username${NC}"
    
    response=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"firstName\": \"Test\",
            \"lastName\": \"User\",
            \"username\": \"$username\",
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"phone\": \"+90$phone\",
            \"role\": \"USER\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ $username kaydedildi${NC}"
        return 0
    else
        echo -e "${RED}❌ $username kaydedilemedi${NC}"
        return 1
    fi
}

# Fonksiyon: Login
login_user() {
    local username=$1
    local password=$2
    
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"password\": \"$password\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        echo "$token"
        return 0
    else
        echo ""
        return 1
    fi
}

# Fonksiyon: Teklif gönderme
send_offer() {
    local token=$1
    local username=$2
    local date=$3
    local start_time=$4
    local end_time=$5
    local location=$6
    local price=$7
    
    response=$(curl -s -X POST "$BASE_URL/goalkeeper-offers" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"listingId\": \"$GOALKEEPER_LISTING_ID\",
            \"matchDate\": \"$date\",
            \"startTime\": \"$start_time\",
            \"endTime\": \"$end_time\",
            \"location\": \"$location\",
            \"description\": \"$username otomatik test teklifi\",
            \"offeredPrice\": $price
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Teklif gönderildi: $price TL${NC}"
        return 0
    else
        echo -e "${RED}❌ Teklif başarısız${NC}"
        return 1
    fi
}

# Test parametreleri
declare -a dates=("2025-07-15" "2025-07-16" "2025-07-17" "2025-07-18" "2025-07-19")
declare -a start_times=("15:00" "16:00" "17:00" "18:00" "19:00")
declare -a end_times=("17:00" "18:00" "19:00" "20:00" "21:00")
declare -a locations=("Beşiktaş Sahası" "Galatasaray Sahası" "Fenerbahçe Sahası" "Kadıköy Halısaha" "Şişli Spor")
declare -a prices=(300 400 500 600 700)

success_count=0
failed_count=0

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}TESTİ BAŞLATILIYOR...${NC}"
echo -e "${BLUE}===========================================${NC}"

# 10 kullanıcı ile test
for i in {1..10}; do
    # Benzersiz kullanıcı bilgileri
    username="QuickTest${TIMESTAMP}User$i"
    email="quicktest${TIMESTAMP}user$i@testmail.com"
    password="Test123456"
    phone_last_digits=$(printf "%03d" $((1000 + TIMESTAMP % 1000 + i)))
    phone="55500000$phone_last_digits"
    
    echo ""
    echo -e "${BLUE}👤 #$i/10: $username${NC}"
    echo "----------------------------------------"
    
    # Kullanıcı kaydı
    if register_user "$username" "$email" "$password" "$phone"; then
        # Login yap
        echo -e "${YELLOW}🔑 Login yapılıyor...${NC}"
        token=$(login_user "$username" "$password")
        
        if [ -n "$token" ]; then
            echo -e "${GREEN}✅ Login başarılı${NC}"
            
            # Parametreler seç
            idx=$((i % 5))
            date="${dates[$idx]}"
            start_time="${start_times[$idx]}"
            end_time="${end_times[$idx]}"
            location="${locations[$idx]}"
            price="${prices[$idx]}"
            
            echo -e "${YELLOW}💰 Teklif: $date $start_time-$end_time | $location | $price TL${NC}"
            
            # Teklif gönder
            if send_offer "$token" "$username" "$date" "$start_time" "$end_time" "$location" "$price"; then
                ((success_count++))
            else
                ((failed_count++))
            fi
        else
            echo -e "${RED}❌ Login başarısız${NC}"
            ((failed_count++))
        fi
    else
        ((failed_count++))
    fi
    
    echo -e "${BLUE}📊 İlerleme: $((i * 10))% ($i/10)${NC}"
    sleep 0.3
done

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}🎯 SONUÇLAR${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}✅ Başarılı teklifler: $success_count${NC}"
echo -e "${RED}❌ Başarısız işlemler: $failed_count${NC}"
echo -e "${YELLOW}📊 Toplam deneme: 10${NC}"

echo ""
echo -e "${GREEN}🎉 HIZLI TEST TAMAMLANDI!${NC}" 