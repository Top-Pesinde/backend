#!/bin/bash

# 50 Kullanıcı Kaleci Teklif Test Scripti
# Bu script 50 farklı kullanıcı oluşturup kaleci ilanına teklif gönderir

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://176.96.131.222:3000/api/v1"
GOALKEEPER_LISTING_ID="cmcxftvji0001mne9e7lwb6nc"

echo -e "${BLUE}🎯 50 Kullanıcı Kaleci Teklif Test Scripti${NC}"
echo -e "${YELLOW}📋 Kaleci İlan ID: $GOALKEEPER_LISTING_ID${NC}"
echo ""

# 50 kullanıcı için diziler oluştur
declare -a usernames=()
declare -a emails=()
declare -a phones=()
declare -a dates=()
declare -a start_times=()
declare -a end_times=()
declare -a locations=()
declare -a prices=()

# Kullanıcı verilerini oluştur
for i in {1..50}; do
    usernames+=("TestUser$i")
    emails+=("testuser$i@test.com")
    phones+=("$(printf "055512%05d" $i)")
    
    # Tarihleri 15 Temmuz'dan itibaren dağıt
    day=$((15 + (i-1) % 15))
    dates+=("2025-07-$day")
    
    # Saatleri dağıt (14:00-22:00 arası)
    start_hour=$((14 + (i-1) % 9))
    end_hour=$((start_hour + 2))
    start_times+=("$(printf "%02d:00" $start_hour)")
    end_times+=("$(printf "%02d:00" $end_hour)")
    
    # Lokasyonları dağıt
    location_names=("Spor Kompleksi" "Futbol Sahası" "Halısaha" "Stadyum" "Antrenman Sahası" "Spor Merkezi" "Futbol Kulübü" "Semt Sahası" "Okul Sahası" "Belediye Sahası")
    location_index=$((i % 10))
    locations+=("${location_names[$location_index]} $i")
    
    # Fiyatları 200-800 TL arası dağıt
    price=$((200 + (i * 12) % 600))
    prices+=($price)
done

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}1. KULLANICILARI KAYDETME (50 adet)${NC}"
echo -e "${BLUE}===========================================${NC}"

registered_count=0

# Kullanıcıları kaydet
for i in {0..49}; do
    username="${usernames[$i]}"
    email="${emails[$i]}"
    phone="${phones[$i]}"
    
    if ((i % 10 == 0)); then
        echo -e "${YELLOW}📝 Kayıt işlemi: $((i+1))/50${NC}"
    fi
    
    response=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"firstName\": \"Test\",
            \"lastName\": \"User$((i+1))\",
            \"username\": \"$username\",
            \"email\": \"$email\",
            \"password\": \"Test1234\",
            \"phone\": \"+90$phone\",
            \"role\": \"USER\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        ((registered_count++))
    fi
    
    # Her 10 kayıtta bir kısa bekleme
    if ((i % 10 == 9)); then
        sleep 1
    fi
done

echo -e "${GREEN}✅ Toplam $registered_count kullanıcı kaydedildi/zaten mevcut${NC}"
echo ""

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}2. TEKLİFLER GÖNDERİLİYOR (50 adet)${NC}"
echo -e "${BLUE}===========================================${NC}"

success_count=0
total_count=0

# Her kullanıcı için teklif gönder
for i in {0..49}; do
    username="${usernames[$i]}"
    date="${dates[$i]}"
    start_time="${start_times[$i]}"
    end_time="${end_times[$i]}"
    location="${locations[$i]}"
    price="${prices[$i]}"
    
    if ((i % 10 == 0)); then
        echo -e "${YELLOW}💰 Teklif gönderimi: $((i+1))/50${NC}"
    fi
    
    # Login
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$username\", \"password\": \"Test1234\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        # Teklif gönder
        offer_response=$(curl -s -X POST "$BASE_URL/goalkeeper-offers" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "{
                \"listingId\": \"$GOALKEEPER_LISTING_ID\",
                \"matchDate\": \"$date\",
                \"startTime\": \"$start_time\",
                \"endTime\": \"$end_time\",
                \"location\": \"$location\",
                \"description\": \"$username tarafından gönderilen test teklifi - $date $start_time-$end_time\",
                \"offeredPrice\": $price
            }")
        
        if echo "$offer_response" | grep -q '"success":true'; then
            ((success_count++))
        fi
    fi
    
    ((total_count++))
    
    # Her 5 teklifte bir kısa bekleme (rate limiting için)
    if ((i % 5 == 4)); then
        sleep 1
    fi
    
    # Progress gösterimi
    if ((i % 10 == 9)); then
        echo -e "${BLUE}📊 İlerleme: $((i+1))/50 - Başarılı: $success_count${NC}"
    fi
done

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}3. SONUÇLAR${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}✅ Başarılı teklif sayısı: $success_count${NC}"
echo -e "${YELLOW}📊 Toplam denenen teklif: $total_count${NC}"
echo -e "${BLUE}🎯 Kaleci İlan ID: $GOALKEEPER_LISTING_ID${NC}"
echo -e "${GREEN}📈 Başarı oranı: $(( success_count * 100 / total_count ))%${NC}"

echo ""
echo -e "${YELLOW}📋 Kaleci tekliflerini kontrol etmek için:${NC}"
echo -e "${BLUE}   curl -X GET \"$BASE_URL/goalkeeper-offers/received\" \\${NC}"
echo -e "${BLUE}     -H \"Authorization: Bearer KALECI_TOKEN\"${NC}"

echo ""
echo -e "${GREEN}🎉 50 kullanıcı test scripti tamamlandı!${NC}"
echo -e "${YELLOW}📝 Kullanıcı adları: TestUser1 → TestUser50${NC}"
echo -e "${YELLOW}🔑 Şifreler: Test1234 (hepsi aynı)${NC}"
echo -e "${YELLOW}💰 Fiyat aralığı: 200-800 TL${NC}"
echo -e "${YELLOW}📅 Tarih aralığı: 2025-07-15 → 2025-07-29${NC}" 