/*
 * The utf8_check() function scans a buffer. It returns a pointer to 
 * the first byte of the first malformed  or overlong UTF-8 sequence found,
 * or -1 if the string contains only correct UTF-8. It also spots UTF-8 
 * sequences that could cause trouble if converted to UTF-16, namely surrogate 
 * characters (U+D800..U+DFFF) and non-Unicode positions (U+FFFE..U+FFFF). This
 * routine is very likely to find a malformed sequence if the input
 * uses any other encoding than UTF-8. It therefore can be used as a
 * very effective heuristic for distinguishing between UTF-8 and other
 * encodings.
 *
 * Original author: Markus Kuhn
 * Obtained from: https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c
 */
function utf8_check(buf: Uint8Array): number
{
  let i: number = 0;
  let s0: number;
  let s1: number;
  let s2: number
  let s3: number
  while (i < buf.length) {
    s0 = buf[i]
    s1 = buf[i + 1]
    s2 = buf[i + 2]
    s3 = buf[i +3]
    if (s0 < 0x80)
      /* 0xxxxxxx */
      i++;
    else if ((s0 & 0xe0) === 0xc0) {
      /* 110XXXXx 10xxxxxx */
      if ((s1 & 0xc0) !== 0x80 ||
	  (s0 & 0xfe) === 0xc0)                        /* overlong? */
{ 	return i; }
      else
{	i += 2;}
} else if ((s0 & 0xf0) === 0xe0) {
      /* 1110XXXX 10Xxxxxx 10xxxxxx */
      if ((s1 & 0xc0) !== 0x80 ||
	  (s2 & 0xc0) !== 0x80 ||
	  (s0== 0xe0 && (s1 & 0xe0) === 0x80) ||    /* overlong? */
	  (s0 == 0xed && (s1 & 0xe0) === 0xa0) ||    /* surrogate? */
	  (s0 == 0xef && s1 === 0xbf &&
	   (s2 & 0xfe) === 0xbe))                      /* U+FFFE or U+FFFF? */
{	return i;}
      else
{	i += 3;}
} else if ((s0 & 0xf8) === 0xf0) {
      /* 11110XXX 10XXxxxx 10xxxxxx 10xxxxxx */
      if ((s1 & 0xc0) !== 0x80 ||
	  (s2 & 0xc0) !== 0x80 ||
	  (s3 & 0xc0) !== 0x80 ||
	  (s0 == 0xf0 && (s1 & 0xf0) === 0x80) ||    /* overlong? */
	  (s0 == 0xf4 && s1 > 0x8f) || s0 > 0xf4) /* > U+10FFFF? */
{ 	return i;}
      else
{ 	i += 4;}
    } else
{
        return i;
}
  }

  return -1;
}

export function validateUtf8(buf: Uint8Array): boolean {
  return utf8_check(buf) === -1;
}

// const FIRST_BIT: number = 0x80;
// const FIRST_TWO_BITS: number = 0xc0;
// const FIRST_THREE_BITS: number = 0xe0;
// const FIRST_FOUR_BITS: number = 0xf0;
// const FIRST_FIVE_BITS: number = 0xf8;
// 
// const TWO_BIT_CHAR: number = 0xc0;
// const THREE_BIT_CHAR: number = 0xe0;
// const FOUR_BIT_CHAR: number = 0xf0;
// const CONTINUING_CHAR: number = 0x80;
// 
// /** Determines if the passed in bytes are valid utf8. */
// export function validateUtf8(buf: Uint8Array): boolean {
//   let continuation: number = 0;
//   for (const byte of buf.values()) {
//     if (continuation) {
//       if ((byte & FIRST_TWO_BITS) !== CONTINUING_CHAR) {
//         return false;
//       }
//       --continuation;
//     } else if (byte & FIRST_BIT) {
//       if ((byte & FIRST_THREE_BITS) === TWO_BIT_CHAR) {
//         continuation = 1;
//       } else if ((byte & FIRST_FOUR_BITS) === THREE_BIT_CHAR) {
//         continuation = 2;
//       } else if ((byte & FIRST_FIVE_BITS) === FOUR_BIT_CHAR) {
//         continuation = 3;
//       } else {
//         return false;
//       }
//     }
//   }
//   return !continuation;
// }
