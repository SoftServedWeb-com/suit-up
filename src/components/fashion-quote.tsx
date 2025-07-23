import { useEffect, useState } from "react";
const fashionQuotes = [
  "Style is a way to say who you are without having to speak. — Rachel Zoe",
  "Fashion is about dressing according to what’s fashionable. Style is more about being yourself. — Oscar de la Renta",
  "Fashion fades, but style is eternal. — Yves Saint Laurent",
  "I don't do fashion. I am fashion. — Coco Chanel",
  "Style is knowing who you are, what you want to say, and not giving a damn. — Gore Vidal",
  "Be yourself. Know your proportions. And have a good tailor. — RuPaul",
  "Style is something each of us already has, all we need to do is find it. — Diane von Furstenberg",
  "Style is a simple way of saying complicated things. — Jean Cocteau",
  "The only rule is don’t be boring and dress cute wherever you go. Life is too short to blend in. — Paris Hilton",
  "Walk like you have three men walking behind you. — Oscar de la Renta",
  "Fashion is what you're offered four times a year by designers. And style is what you choose. — Lauren Hutton",
  "The dress must follow the body of a woman, not the body following the shape of the dress. — Hubert de Givenchy",
  "Fashion you can buy, but style you possess. — Iris Apfel",
  "Luxury is the ease of a T-shirt in a very expensive dress. — Karl Lagerfeld",
  "The best things in life are free. The second best are very expensive. — Coco Chanel",
  "Dress shabbily and they remember the dress; dress impeccably and they notice the woman. — Coco Chanel",
  "Elegance is not standing out, but being remembered. — Giorgio Armani",
  "Elegance is elimination. — Cristóbal Balenciaga",
  "Shoes transform your body language and attitude. They lift you physically and emotionally. — Christian Louboutin",
  "Elegance is good taste, plus a dash of daring. — Carmel Snow",
  "Looking good isn’t self-importance; it’s self-respect. — Charles Hix",
  "Give a girl the right kind of shoes and she can rule the world. — Marilyn Monroe",
  "Sweatpants are a sign of defeat. You’ve lost control of your life, so you bought some sweatpants. — Karl Lagerfeld",
  "The zenith of elegance in any woman’s wardrobe is the little black dress, the power of which suggests dash and refinement. — André Leon Talley",
  "Care for your clothes like the good friends they are. — Joan Crawford",
  "Just because a suit fits, doesn't mean it looks good. You need a tailor. — Ryan Tedder",
  "If you’re wearing suits and you want to create your own sense of style, get to the tailor. — Matt Bomer",
  "If you are out to describe the truth, leave elegance to the tailor. — Albert Einstein",
  "A gentleman never talks about his tailor. — Nick Cave",
  "The most important thing in clothing is to find a good, inexpensive tailor, because clothes at the stores are made for bodies that are anomalies. — Ginnifer Goodwin",
  "Clothes make the man. Naked people have little or no influence on society. — Mark Twain",
  "Fashion is more about taste than money – you have to understand your body and tailor clothes to your needs. — Carmen Dell'Orefice",
  "It is the accuracy and detail inherent in crafted goods that endows them with lasting value... the time and attention paid by the seamstress and the tailor that makes this detail possible. — Tim Jackson",
  "Clothes are like a good meal, a good movie, great pieces of music. — Michael Kors",
  "I do the alterations myself — I'm quite a seamstress. — Carmen Dell'Orefice",
  "Fashion is instant language. — Miuccia Prada",
  "Fashion should be a form of escapism, not a form of imprisonment. — Alexander McQueen",
  "Fashion is only the attempt to realize art in living forms and social intercourse. — Francis Bacon",
  "To wear dreams on one's feet is to begin to give a reality to one's dreams. — Roger Vivier",
  "We don’t need fashion to survive, we just desire it so much. — Marc Jacobs",
  "If you love something, wear it all the time. Find things that suit you. This is how you look extraordinary. — Vivienne Westwood",
  "Florals? For Spring? Groundbreaking. — Miranda Priestly",
  "Fashion as we knew it is over; people wear now exactly what they feel like wearing. — Mary Quant",
  "Fashion fosters the clichés of beauty, but I want to tear them apart. — Miuccia Prada",
  "Clothes aren’t going to change the world. The women who wear them are. — Anne Klein",
  "Design can be art. Design can be aesthetics. Design is so simple, that’s why it is so complicated. — Paul Rand",
  "You can have anything you want in life if you dress for it. — Edith Head",
  "I like my money right where I can see it… hanging in my closet. — Carrie Bradshaw",
  "You gotta have style. It helps you get down the stairs. It helps you get up in the morning. Without it, you’re nobody. — Diana Vreeland",
  "If you’re asking someone for money, wear a tie. — Unknown",
  "Dressing well is a form of good manners. — Tom Ford",
  "I may be a beginner at some things, but I’ve got a black belt in shopping. — Phyllis Nefler",
  "The idea is to create go-to pieces... a woman will love today, in two months, in five years. — Narciso Rodriguez",
  "Conformity is the only real fashion crime. To not dress like yourself... is succumbing to fashion fascism. — Simon Doonan"
];

export default function FashionQuote() {
  const [quote, setQuote] = useState<string>("");
  const [author, setAuthor] = useState<string>("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * fashionQuotes.length);
    const fullQuote = fashionQuotes[randomIndex];

    const [quoteText, quoteAuthor] = fullQuote.split(" — ");
    setQuote(quoteText.trim());
    setAuthor(quoteAuthor?.trim() || "");
  }, []);

  return (
    <div className="text-center mb-8 border-b border-border pb-8">
      <div className="max-w-full mx-auto">
        <p className="text-lg font-light font-serif text-accent-foreground italic transition-all duration-500 ease-in-out min-h-[3rem] flex items-center justify-center">
          “{quote}”
        </p>
        {author && (
          <p className="text-sm text-muted-foreground font-light font-serif">
            — {author}
          </p>
        )}
      </div>
    </div>
  );
}